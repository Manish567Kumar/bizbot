import { Request, Response, NextFunction } from 'express';
import { PaginationSchema, HTTP_STATUS } from '@bizbot/shared';
import { z } from 'zod';
import * as service from './conversations.service';

export async function listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pagination = PaginationSchema.parse(req.query);
    const status = req.query.status as string | undefined;
    const result = await service.listConversations(req.user!.businessId, pagination, status);
    res.json({ data: result, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}

export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pagination = PaginationSchema.parse(req.query);
    const result = await service.getConversationMessages(req.user!.businessId, req.params.id, pagination);
    res.json({ data: result, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status } = z.object({ status: z.enum(['OPEN', 'RESOLVED']) }).parse(req.body);
    const data = await service.updateConversationStatus(req.user!.businessId, req.params.id, status);
    res.json({ data, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}

export async function toggleBot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
    const data = await service.toggleBot(req.user!.businessId, req.params.id, enabled);
    res.json({ data, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
}
