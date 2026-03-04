import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS, OTP_EXPIRY_MINUTES, type AuthTokens, type JwtPayload } from '@bizbot/shared';

// ─── MSG91 OTP ────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<void> {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate old OTPs for this phone
  await prisma.otpRecord.updateMany({
    where: { phone, verified: false },
    data: { verified: true }, // soft-invalidate
  });

  await prisma.otpRecord.create({
    data: { phone, otp, expiresAt },
  });

  if (env.NODE_ENV === 'development') {
    // Log OTP in dev — never in production
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return;
  }

  // MSG91 send OTP — https://docs.msg91.com/reference/send-otp
  const phoneNum = phone.replace('+', '');
  await axios.post(
    'https://control.msg91.com/api/v5/otp',
    {
      template_id: env.MSG91_TEMPLATE_ID,
      mobile: phoneNum,
      authkey: env.MSG91_AUTH_KEY,
      otp,
    },
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export async function verifyOtp(phone: string, otp: string): Promise<AuthTokens> {
  const record = await prisma.otpRecord.findFirst({
    where: {
      phone,
      otp,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid or expired OTP', 'OTP_INVALID');
  }

  await prisma.otpRecord.update({
    where: { id: record.id },
    data: { verified: true },
  });

  // Find or create business + user for this phone
  let business = await prisma.business.findFirst({
    where: { users: { some: { phone } } },
    include: { users: { where: { phone } } },
  });

  if (!business) {
    // First login — create business and owner user
    business = await prisma.business.create({
      data: {
        name: 'My Business',
        phone,
        users: { create: { phone, role: 'OWNER' } },
      },
      include: { users: { where: { phone } } },
    });
  }

  const user = business.users[0];
  const tokens = generateTokens(user.id, business.id, phone, user.role);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      lastLoginAt: new Date(),
    },
  });

  return tokens;
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Invalid refresh token', 'TOKEN_INVALID');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, businessId: true, phone: true, role: true, refreshToken: true },
  });

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token reuse detected', 'TOKEN_REUSE');
  }

  const tokens = generateTokens(user.id, user.businessId, user.phone, user.role);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return tokens;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTokens(userId: string, businessId: string, phone: string, role: string): AuthTokens {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: userId,
    businessId,
    phone,
    role: role as JwtPayload['role'],
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken, expiresIn: 15 * 60 }; // 15 min in seconds
}
