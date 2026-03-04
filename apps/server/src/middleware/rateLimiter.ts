import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS } from '@bizbot/shared';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory rate limiter — replace with Redis-backed for production clustering
const store = new Map<string, RateLimitEntry>();

function createLimiter(options: { windowMs: number; max: number; keyFn?: (req: Request) => string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyFn ? options.keyFn(req) : req.ip ?? 'unknown';
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (entry.count >= options.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        data: null,
        error: `Too many requests. Retry after ${retryAfter}s`,
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
      });
      return;
    }

    entry.count++;
    next();
  };
}

// 5 OTP requests per phone per 10 minutes
export const otpRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyFn: (req) => `otp:${(req.body as { phone?: string }).phone ?? req.ip}`,
});

// General API: 100 requests per minute
export const apiRateLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
});
