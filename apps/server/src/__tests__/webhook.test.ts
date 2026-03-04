import request from 'supertest';
import crypto from 'crypto';
import express from 'express';
import { verifyWebhook, receiveWebhook } from '../modules/whatsapp/webhook.handler';

// ─── Mock database so we never touch Postgres ─────────────────────────────────
jest.mock('../config/database', () => ({
  prisma: {
    business: { findFirst: jest.fn() },
    customer: { upsert: jest.fn() },
    conversation: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    message: { create: jest.fn(), updateMany: jest.fn() },
    analytics: { upsert: jest.fn() },
  },
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

// ─── Mock bot engine and WhatsApp service ─────────────────────────────────────
jest.mock('../modules/bot/flow.engine', () => ({
  processFlow: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../modules/whatsapp/whatsapp.service', () => ({
  sendTextMessage: jest.fn().mockResolvedValue('wamid.test123'),
  sendQuickReply: jest.fn().mockResolvedValue('wamid.test456'),
  markMessageRead: jest.fn().mockResolvedValue(undefined),
}));

// ─── Minimal Express app with just the webhook routes ─────────────────────────
const app = express();
app.use('/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    (req as express.Request & { rawBody: Buffer }).rawBody = req.body;
    req.body = JSON.parse(req.body.toString());
  }
  next();
});
app.use(express.json());
app.get('/webhook', verifyWebhook);
app.post('/webhook', receiveWebhook);

const VERIFY_TOKEN = 'test-verify-token';   // matches META_VERIFY_TOKEN in setup.ts
const APP_SECRET = 'test-app-secret';       // matches META_APP_SECRET in setup.ts

function signPayload(body: object): string {
  return `sha256=${crypto
    .createHmac('sha256', APP_SECRET)
    .update(JSON.stringify(body))
    .digest('hex')}`;
}

// ─── Test: GET /webhook (Meta verification handshake) ─────────────────────────
describe('GET /webhook — Meta verification handshake', () => {
  it('returns challenge when verify_token matches', async () => {
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'CHALLENGE_STRING',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('CHALLENGE_STRING');
  });

  it('returns 403 when verify_token is wrong', async () => {
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': 'CHALLENGE_STRING',
      });

    expect(res.status).toBe(403);
  });

  it('returns 403 when hub.mode is not subscribe', async () => {
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'unsubscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'CHALLENGE_STRING',
      });

    expect(res.status).toBe(403);
  });

  it('returns exact challenge string without modification', async () => {
    const challenge = 'abc123XYZ!@#';
    const res = await request(app)
      .get('/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': challenge,
      });

    expect(res.text).toBe(challenge);
  });
});

// ─── Test: POST /webhook (receive messages) ────────────────────────────────────
describe('POST /webhook — receive messages', () => {
  const validPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-id',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '911234567890',
                phone_number_id: 'phone-number-id-123',
              },
              contacts: [{ profile: { name: 'Test User' }, wa_id: '919876543210' }],
              messages: [
                {
                  from: '919876543210',
                  id: 'wamid.test001',
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: 'hi' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  it('always returns 200 immediately (Meta requirement)', async () => {
    const sig = signPayload(validPayload);
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', sig)
      .send(validPayload);

    expect(res.status).toBe(200);
  });

  it('returns 200 even with bad signature (always ACK to Meta)', async () => {
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', 'sha256=invalidsignature')
      .send(validPayload);

    expect(res.status).toBe(200);
  });

  it('returns 200 with no signature header', async () => {
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .send(validPayload);

    expect(res.status).toBe(200);
  });

  it('returns 200 for status update payload (no messages field)', async () => {
    const statusPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry-id',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '911234567890', phone_number_id: 'pid' },
                statuses: [
                  {
                    id: 'wamid.test001',
                    status: 'delivered',
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    recipient_id: '919876543210',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const sig = signPayload(statusPayload);
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', sig)
      .send(statusPayload);

    expect(res.status).toBe(200);
  });

  it('ignores non-whatsapp_business_account object type', async () => {
    const payload = { object: 'page', entry: [] };
    const sig = signPayload(payload);
    const res = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .set('x-hub-signature-256', sig)
      .send(payload);

    expect(res.status).toBe(200);
  });
});

// ─── HMAC signature verification ──────────────────────────────────────────────
describe('HMAC signature verification', () => {
  it('signPayload helper produces valid sha256 HMAC', () => {
    const body = { test: 'payload' };
    const sig = signPayload(body);
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('different payloads produce different signatures', () => {
    expect(signPayload({ a: 1 })).not.toBe(signPayload({ b: 2 }));
  });
});
