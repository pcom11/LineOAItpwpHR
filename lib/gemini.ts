import { GoogleGenAI } from '@google/genai';
import type { FaqRow } from './faq';

const MODEL = 'gemini-3.5-flash';
const TEMPERATURE = 1.0;
const MAX_OUTPUT_TOKENS = 1024;

export const DEFAULT_REPLY =
  'ขออภัยค่ะ ระบบไม่สามารถสรุปคำตอบให้ได้ในขณะนี้ กรุณาลองถามใหม่อีกครั้ง หรือสอบถามเจ้าหน้าที่โดยตรงค่ะ';

let clientCache: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (clientCache) return clientCache;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  clientCache = new GoogleGenAI({ apiKey });
  return clientCache;
}

function buildSystemInstruction(faq: FaqRow[]): string {
  const knowledge = faq
    .map((row, i) => `${i + 1}. Q: ${row.question}\n   A: ${row.answer}`)
    .join('\n');

  return [
    'คุณคือผู้ช่วย HR ของ ITPWP ตอบลูกค้าผ่าน LINE Official Account',
    'ตอบเป็นภาษาธรรมชาติ สุภาพ กระชับ ตรงประเด็น',
    'ใช้ข้อมูลจาก FAQ ด้านล่างเป็นหลัก หากคำถามไม่อยู่ใน FAQ ให้ตอบอย่างสุภาพว่าจะส่งต่อให้เจ้าหน้าที่',
    'อย่าแต่งข้อมูลที่ไม่มีใน FAQ',
    '',
    '=== FAQ ===',
    knowledge || '(ยังไม่มีข้อมูล FAQ)',
  ].join('\n');
}

export type GeminiReplyResult = {
  text: string;
  finishReason: string | undefined;
  usedDefault: boolean;
};

export async function generateReply(
  userMessage: string,
  faq: FaqRow[]
): Promise<GeminiReplyResult> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL,
    contents: userMessage,
    config: {
      systemInstruction: buildSystemInstruction(faq),
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  });

  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const thoughtsTokenCount = response.usageMetadata?.thoughtsTokenCount;
  const candidatesTokenCount = response.usageMetadata?.candidatesTokenCount;

  console.log('[gemini]', {
    finishReason,
    thoughtsTokenCount,
    candidatesTokenCount,
  });

  if (finishReason === 'MAX_TOKENS') {
    return { text: DEFAULT_REPLY, finishReason, usedDefault: true };
  }

  const text = response.text?.trim();
  if (!text) {
    return { text: DEFAULT_REPLY, finishReason, usedDefault: true };
  }

  return { text, finishReason, usedDefault: false };
}
