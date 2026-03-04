// Set all required env vars BEFORE any module that imports env.ts is loaded
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-32-chars-long';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.MSG91_AUTH_KEY = 'test-msg91-auth-key';
process.env.MSG91_TEMPLATE_ID = 'test-template-id';
process.env.MSG91_SENDER_ID = 'BIZBOTAPP';
process.env.META_VERIFY_TOKEN = 'test-verify-token';
process.env.META_APP_SECRET = 'test-app-secret';
process.env.META_API_VERSION = 'v18.0';
process.env.META_ACCESS_TOKEN = 'test-access-token';
