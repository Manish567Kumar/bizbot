import { Request, Response, NextFunction } from 'express';
import { BusinessProfileSchema, HTTP_STATUS } from '@bizbot/shared';
import * as businessService from './business.service';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await businessService.getBusinessProfile(req.user!.businessId);
    res.json({ data, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = BusinessProfileSchema.parse(req.body);
    const data = await businessService.updateBusinessProfile(req.user!.businessId, input);
    res.json({ data, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}
