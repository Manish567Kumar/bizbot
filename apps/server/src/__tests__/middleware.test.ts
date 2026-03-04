import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler, AppError } from '../middleware/errorHandler';

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const noop: NextFunction = jest.fn();

describe('errorHandler middleware', () => {
  const req = {} as Request;

  it('handles AppError with correct status and message', () => {
    const res = makeRes();
    const err = new AppError(404, 'Not found', 'NOT_FOUND');
    errorHandler(err, req, res, noop);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Not found', code: 'NOT_FOUND', status: 404 }),
    );
  });

  it('handles ZodError with 400 and field errors', () => {
    const res = makeRes();
    let zodErr: ZodError;
    try {
      z.object({ phone: z.string().min(10) }).parse({});
    } catch (e) {
      zodErr = e as ZodError;
    }
    errorHandler(zodErr!, req, res, noop);
    expect(res.status).toHaveBeenCalledWith(400);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(call.status).toBe(400);
    expect(call.error).toBe('Validation error');
    expect(call.details).toBeDefined();
  });

  it('handles unknown errors with 500', () => {
    const res = makeRes();
    errorHandler(new Error('boom'), req, res, noop);
    expect(res.status).toHaveBeenCalledWith(500);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(call.status).toBe(500);
  });

  it('sets data: null on all error responses', () => {
    const res = makeRes();
    errorHandler(new AppError(401, 'Unauthorized'), req, res, noop);
    const call = (res.json as jest.Mock).mock.calls[0][0];
    expect(call.data).toBeNull();
  });
});

describe('AppError', () => {
  it('stores statusCode, message, and code', () => {
    const err = new AppError(403, 'Forbidden', 'FORBIDDEN');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Forbidden');
    expect(err.code).toBe('FORBIDDEN');
    expect(err).toBeInstanceOf(Error);
  });

  it('works without a code', () => {
    const err = new AppError(500, 'Server error');
    expect(err.code).toBeUndefined();
  });
});
