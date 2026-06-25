import { NextRequest, NextResponse } from 'next/server';
import {
  messagingApi,
  validateSignature,
  type WebhookEvent,
  type MessageEvent,
  type TextEventMessage,
} from '@line/bot-sdk';
import { loadFaq } from '@/lib/faq';
import { generateReply, DEFAULT_REPLY } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { MessagingApiClient } = messagingApi;

function getLineClient() {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  return new MessagingApiClient({ channelAccessToken });
}

function isTextMessageEvent(
  event: WebhookEvent
): event is MessageEvent & { message: TextEventMessage } {
  return event.type === 'message' && event.message.type === 'text';
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: '/api/line-webhook' });
}

export async function POST(req: NextRequest) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('[webhook] LINE_CHANNEL_SECRET is not set');
    return NextResponse.json({ error: 'server misconfigured' }, { status: 500 });
  }

  const signature = req.headers.get('x-line-signature') ?? '';
  const rawBody = await req.text();

  if (!validateSignature(rawBody, channelSecret, signature)) {
    console.warn('[webhook] invalid signature');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as { events?: WebhookEvent[] };
  const events = payload.events ?? [];

  const csvUrl = process.env.SHEET_CSV_URL;
  const faq = csvUrl ? await loadFaq(csvUrl).catch((err) => {
    console.error('[webhook] FAQ load failed', err);
    return [];
  }) : [];

  const lineClient = getLineClient();

  await Promise.all(
    events.map(async (event) => {
      if (!isTextMessageEvent(event)) return;

      const userText = event.message.text;
      console.log('[webhook] incoming', { userId: event.source.userId, text: userText });

      let replyText: string;
      try {
        const result = await generateReply(userText, faq);
        replyText = result.text;
      } catch (err) {
        console.error('[webhook] gemini error', err);
        replyText = DEFAULT_REPLY;
      }

      try {
        await lineClient.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: replyText }],
        });
      } catch (err) {
        console.error('[webhook] LINE reply error', err);
      }
    })
  );

  return NextResponse.json({ ok: true });
}
