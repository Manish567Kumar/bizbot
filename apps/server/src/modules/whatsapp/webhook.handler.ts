import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env';
import { processIncomingMessage } from './message.processor';
import { prisma } from '../../config/database';
import { type MetaWebhookPayload } from '@bizbot/shared';

// ─── GET /webhook — Meta verification handshake ────────────────────────────────

export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
    console.log('[Webhook] Verification successful');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook] Verification failed — token mismatch');
    res.sendStatus(403);
  }
}

// ─── POST /webhook — Receive messages ─────────────────────────────────────────

export async function receiveWebhook(req: Request, res: Response): Promise<void> {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  if (!verifySignature(req)) {
    console.warn('[Webhook] Signature verification failed');
    return;
  }

  const payload = req.body as MetaWebhookPayload;
  if (payload.object !== 'whatsapp_business_account') return;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;

      const { value } = change;
      const phoneNumberId = value.metadata?.phone_number_id;

      // Handle incoming messages
      for (const message of value.messages ?? []) {
        const contact = value.contacts?.find((c) => c.wa_id === message.from);
        processIncomingMessage({ phoneNumberId, message, contact }).catch((err) =>
          console.error('[Webhook] processIncomingMessage error:', err),
        );
      }

      // Handle status updates
      for (const status of value.statuses ?? []) {
        updateMessageStatus(status.id, status.status).catch(() => undefined);
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function verifySignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signature) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', env.META_APP_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex')}`;

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  // timingSafeEqual requires equal-length buffers — mismatched length = invalid
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

async function updateMessageStatus(waMessageId: string, status: string): Promise<void> {
  const statusMap: Record<string, 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'> = {
    sent: 'SENT',
    delivered: 'DELIVERED',
    read: 'READ',
    failed: 'FAILED',
  };
  const mappedStatus = statusMap[status];
  if (!mappedStatus) return;

  await prisma.message.updateMany({
    where: { waMessageId },
    data: { status: mappedStatus },
  });
}
