import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HTTP_STATUS } from '@bizbot/shared';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      data: null,
      error: 'Validation error',
      details: err.flatten().fieldErrors,
      status: HTTP_STATUS.BAD_REQUEST,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      data: null,
      error: err.message,
      code: err.code,
      status: err.statusCode,
    });
    return;
  }

  console.error('[UnhandledError]', err);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    data: null,
    error: 'An unexpected error occurred',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}
