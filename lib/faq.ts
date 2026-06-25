export type FaqRow = {
  question: string;
  answer: string;
};

type CacheState = {
  rows: FaqRow[];
  fetchedAt: number;
};

const CACHE_TTL_MS = 60_000;
let cache: CacheState | null = null;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function rowsToFaq(matrix: string[][]): FaqRow[] {
  if (matrix.length === 0) return [];

  const [header, ...body] = matrix;
  const lowerHeader = header.map((h) => h.trim().toLowerCase());
  const qIdx = lowerHeader.findIndex((h) => h === 'question' || h === 'q' || h === 'คำถาม');
  const aIdx = lowerHeader.findIndex((h) => h === 'answer' || h === 'a' || h === 'คำตอบ');

  const questionIndex = qIdx >= 0 ? qIdx : 0;
  const answerIndex = aIdx >= 0 ? aIdx : 1;

  return body
    .map((r) => ({
      question: (r[questionIndex] ?? '').trim(),
      answer: (r[answerIndex] ?? '').trim(),
    }))
    .filter((r) => r.question.length > 0 && r.answer.length > 0);
}

export async function loadFaq(csvUrl: string): Promise<FaqRow[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rows;
  }

  const res = await fetch(csvUrl, { cache: 'no-store' });
  if (!res.ok) {
    if (cache) return cache.rows;
    throw new Error(`Failed to fetch FAQ CSV: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const rows = rowsToFaq(parseCsv(text));
  cache = { rows, fetchedAt: now };
  return rows;
}
