import request from 'supertest';
import jwt from 'jsonwebtoken';

// ─── Bypass rate limiter so in-memory state doesn't bleed between tests ────────
jest.mock('../middleware/rateLimiter', () => ({
  otpRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  apiRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// ─── Mock database — define fns INSIDE factory to avoid hoisting issues ────────
jest.mock('../config/database', () => ({
  prisma: {
    otpRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    business: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
  connectDatabase: jest.fn(),
  disconnectDatabase: jest.fn(),
}));

// ─── Mock WhatsApp service (has module-level axios.create call) ───────────────
jest.mock('../modules/whatsapp/whatsapp.service', () => ({
  sendTextMessage: jest.fn().mockResolvedValue('wamid.test'),
  sendQuickReply: jest.fn().mockResolvedValue('wamid.test'),
  markMessageRead: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock bot engine (imports whatsapp service) ────────────────────────────────
jest.mock('../modules/bot/flow.engine', () => ({
  processFlow: jest.fn().mockResolvedValue(undefined),
  seedIndustryTemplates: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock message processor ───────────────────────────────────────────────────
jest.mock('../modules/whatsapp/message.processor', () => ({
  processIncomingMessage: jest.fn().mockResolvedValue(undefined),
}));

// ─── Mock MSG91 axios call in auth.service ────────────────────────────────────
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn().mockResolvedValue({ data: { type: 'success' } }),
    create: jest.fn().mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: { messages: [{ id: 'wamid.test' }] } }),
    }),
  },
  post: jest.fn().mockResolvedValue({ data: { type: 'success' } }),
}));

// Import AFTER mocks are registered
import app from '../app';
import { prisma } from '../config/database';

// Typed mock helpers
const db = prisma as unknown as {
  otpRecord: Record<string, jest.Mock>;
  business: Record<string, jest.Mock>;
  user: Record<string, jest.Mock>;
};

const ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-chars-long';
const REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-chars-long';

// ─── POST /api/v1/auth/send-otp ───────────────────────────────────────────────
describe('POST /api/v1/auth/send-otp', () => {
  beforeEach(() => {
    db.otpRecord.updateMany.mockResolvedValue({ count: 0 });
    db.otpRecord.create.mockResolvedValue({ id: 'otp-id' });
  });

  it('returns 200 with valid Indian phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '9876543210' });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('OTP sent successfully');
    expect(res.body.error).toBeNull();
  });

  it('accepts +91 prefixed phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '+919876543210' });

    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid phone number', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.data).toBeNull();
    expect(res.body.error).toBe('Validation error');
  });

  it('returns 400 for phone starting with 5', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '5123456789' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when phone is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({});

    expect(res.status).toBe(400);
  });

  it('creates OTP record in DB', async () => {
    await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '9876543210' });

    expect(db.otpRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: '+919876543210' }),
      }),
    );
  });
});

// ─── POST /api/v1/auth/verify-otp ─────────────────────────────────────────────
describe('POST /api/v1/auth/verify-otp', () => {
  const mockBusiness = {
    id: 'biz-001',
    name: 'Test Business',
    phone: '+919876543210',
    users: [{ id: 'user-001', phone: '+919876543210', role: 'OWNER', refreshToken: null }],
  };

  beforeEach(() => {
    db.otpRecord.findFirst.mockResolvedValue({
      id: 'otp-001',
      phone: '+919876543210',
      otp: '123456',
      verified: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    db.otpRecord.update.mockResolvedValue({ id: 'otp-001', verified: true });
    db.business.findFirst.mockResolvedValue(mockBusiness);
    db.user.update.mockResolvedValue(mockBusiness.users[0]);
  });

  it('returns 200 with access and refresh tokens on valid OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9876543210', otp: '123456' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresIn: expect.any(Number),
    });
  });

  it('access token is a valid JWT with correct payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9876543210', otp: '123456' });

    const { accessToken } = res.body.data;
    const payload = jwt.verify(accessToken, ACCESS_SECRET) as Record<string, string>;
    expect(payload.sub).toBe('user-001');
    expect(payload.businessId).toBe('biz-001');
    expect(payload.role).toBe('OWNER');
  });

  it('returns 400 for invalid OTP', async () => {
    db.otpRecord.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9876543210', otp: '999999' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid or expired OTP');
  });

  it('returns 400 for malformed OTP (too short)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9876543210', otp: '12345' });

    expect(res.status).toBe(400);
  });

  it('creates business + user on first login', async () => {
    db.business.findFirst.mockResolvedValue(null);
    db.business.create.mockResolvedValue({
      ...mockBusiness,
      users: [{ id: 'user-new', phone: '+919876543210', role: 'OWNER', refreshToken: null }],
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9876543210', otp: '123456' });

    expect(res.status).toBe(200);
    expect(db.business.create).toHaveBeenCalled();
  });
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
describe('POST /api/v1/auth/refresh', () => {
  it('returns 400 when refreshToken is missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 for an invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' });

    expect(res.status).toBe(401);
  });

  it('returns 401 on token reuse (different token in DB)', async () => {
    const token = jwt.sign(
      { sub: 'user-001', businessId: 'biz-001', phone: '+919876543210', role: 'OWNER' },
      REFRESH_SECRET,
      { expiresIn: '7d' },
    );
    db.user.findUnique.mockResolvedValue({
      id: 'user-001', refreshToken: 'different-token', businessId: 'biz-001',
      phone: '+919876543210', role: 'OWNER',
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('reuse');
  });
});

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
describe('GET /api/v1/auth/me', () => {
  it('returns 401 without auth header', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });

  it('returns 200 with valid JWT and user payload', async () => {
    const token = jwt.sign(
      { sub: 'user-001', businessId: 'biz-001', phone: '+919876543210', role: 'OWNER' },
      ACCESS_SECRET,
      { expiresIn: '15m' },
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sub).toBe('user-001');
    expect(res.body.data.role).toBe('OWNER');
  });
});
