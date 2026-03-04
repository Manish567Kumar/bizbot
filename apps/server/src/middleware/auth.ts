import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, HTTP_STATUS } from '@bizbot/shared';
import { env } from '../config/env';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Missing or invalid Authorization header', 'AUTH_REQUIRED'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Token expired', 'TOKEN_EXPIRED'));
    }
    next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid token', 'TOKEN_INVALID'));
  }
}

export function requireRole(...roles: JwtPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Authentication required', 'AUTH_REQUIRED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(HTTP_STATUS.FORBIDDEN, 'Insufficient permissions', 'FORBIDDEN'));
    }
    next();
  };
}
