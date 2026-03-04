import { Request, Response, NextFunction } from 'express';
import { PaginationSchema, HTTP_STATUS } from '@bizbot/shared';
import { z } from 'zod';
import * as service from './customers.service';

export async function listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pagination = PaginationSchema.parse(req.query);
    const result = await service.listCustomers(req.user!.businessId, pagination);
    res.json({ data: result, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}

export async function getCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await service.getCustomer(req.user!.businessId, req.params.id);
    res.json({ data, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}

export async function updateTags(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tags } = z.object({ tags: z.array(z.string()) }).parse(req.body);
    const data = await service.updateCustomerTags(req.user!.businessId, req.params.id, tags);
    res.json({ data, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}
