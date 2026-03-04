import { Request, Response, NextFunction } from 'express';
import { SendOtpSchema, VerifyOtpSchema, RefreshTokenSchema, HTTP_STATUS } from '@bizbot/shared';
import * as authService from './auth.service';

export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = SendOtpSchema.parse(req.body);
    await authService.sendOtp(phone);
    res.status(HTTP_STATUS.OK).json({
      data: { message: 'OTP sent successfully' },
      error: null,
      status: HTTP_STATUS.OK,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, otp } = VerifyOtpSchema.parse(req.body);
    const tokens = await authService.verifyOtp(phone, otp);
    res.status(HTTP_STATUS.OK).json({
      data: tokens,
      error: null,
      status: HTTP_STATUS.OK,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = RefreshTokenSchema.parse(req.body);
    const tokens = await authService.refreshTokens(refreshToken);
    res.status(HTTP_STATUS.OK).json({
      data: tokens,
      error: null,
      status: HTTP_STATUS.OK,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(HTTP_STATUS.OK).json({
      data: req.user,
      error: null,
      status: HTTP_STATUS.OK,
    });
  } catch (err) {
    next(err);
  }
}
