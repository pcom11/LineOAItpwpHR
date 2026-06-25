# LINE OA ITPWP HR

LINE Official Account webhook bridge, built on **Next.js 14 (App Router) + TypeScript**, deployed on Vercel. Incoming LINE messages are answered by **Google Gemini** using an FAQ pulled from a Google Sheet (CSV).

- Repo: https://github.com/pcom11/LineOAItpwpHR
- Webhook: https://line-oa-itpwp-hr.vercel.app/api/line-webhook

## Stack

- Next.js 14 App Router + TypeScript
- `@line/bot-sdk` for webhook signature validation and reply
- `@google/genai` calling `gemini-3.5-flash`
- FAQ from a public Google Sheet CSV, cached in memory for 60s

## Endpoints

| Method | Path                | Purpose                                  |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/api/line-webhook` | Health probe                             |
| POST   | `/api/line-webhook` | LINE webhook (signature-verified)        |

## Environment variables

All four are already configured in Vercel:

| Name                        | Notes                                              |
| --------------------------- | -------------------------------------------------- |
| `LINE_CHANNEL_ACCESS_TOKEN` | From LINE Developers > Messaging API channel       |
| `LINE_CHANNEL_SECRET`       | From LINE Developers > Basic settings              |
| `GEMINI_API_KEY`            | From Google AI Studio                              |
| `SHEET_CSV_URL`             | Public CSV export URL of the FAQ Google Sheet      |

## Gemini configuration (spec)

- Model: `gemini-3.5-flash`
- `temperature = 1.0` (default — do not tune)
- `maxOutputTokens = 1024` — Gemini 3.x counts thinking + output together; 200 truncates mid-sentence.
- Every request logs `finishReason`, `thoughtsTokenCount`, and `candidatesTokenCount`.
- When `finishReason === 'MAX_TOKENS'`, the user gets a safe default reply instead of a truncated answer.

## FAQ Google Sheet

The sheet must be published as CSV. Expected columns:

| question | answer |
| -------- | ------ |

Headers `Q`/`A` or Thai `คำถาม`/`คำตอบ` are also accepted. The CSV is fetched on demand and cached in memory for 60 seconds.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the four env vars
npm run dev
```

The webhook is at `http://localhost:3000/api/line-webhook`. Use ngrok / Cloudflare Tunnel to expose it to LINE while developing.

## Deploying

Pushes to `main` deploy automatically on Vercel. Confirm the production webhook URL is set in the LINE Developers console:

```
https://line-oa-itpwp-hr.vercel.app/api/line-webhook
```
