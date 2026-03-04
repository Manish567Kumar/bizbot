import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from './errorHandler';
import { HTTP_STATUS } from '@bizbot/shared';

declare global {
  namespace Express {
    interface Request {
      business?: { id: string; name: string; planTier: string; isActive: boolean };
    }
  }
}

export async function resolveTenant(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user?.businessId) {
    return next(new AppError(HTTP_STATUS.UNAUTHORIZED, 'Business context missing', 'NO_TENANT'));
  }

  try {
    const business = await prisma.business.findUnique({
      where: { id: req.user.businessId },
      select: { id: true, name: true, planTier: true, isActive: true },
    });

    if (!business) {
      return next(new AppError(HTTP_STATUS.NOT_FOUND, 'Business not found', 'BUSINESS_NOT_FOUND'));
    }

    if (!business.isActive) {
      return next(new AppError(HTTP_STATUS.FORBIDDEN, 'Account suspended', 'ACCOUNT_SUSPENDED'));
    }

    req.business = business;
    next();
  } catch (err) {
    next(err);
  }
}
