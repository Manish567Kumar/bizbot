export const INDUSTRIES = ['RESTAURANT', 'SALON', 'CLINIC', 'TUITION', 'SHOP', 'OTHER'] as const;

export const PLAN_TIERS = ['FREE', 'STARTER', 'GROWTH', 'PRO'] as const;

export const PLAN_LIMITS: Record<string, { monthlyMessages: number; contacts: number; flows: number }> = {
  FREE:    { monthlyMessages: 500,   contacts: 100,  flows: 3 },
  STARTER: { monthlyMessages: 5000,  contacts: 1000, flows: 10 },
  GROWTH:  { monthlyMessages: 25000, contacts: 5000, flows: 30 },
  PRO:     { monthlyMessages: -1,    contacts: -1,   flows: -1 },
};

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_LENGTH = 6;

export const INDIA_COUNTRY_CODE = '+91';
export const INDIA_PHONE_REGEX = /^(\+91|91)?[6-9]\d{9}$/;

export const META_API_BASE = 'https://graph.facebook.com';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const INDUSTRY_LABELS: Record<string, string> = {
  RESTAURANT: 'Restaurant / Food',
  SALON: 'Salon / Spa / Beauty',
  CLINIC: 'Clinic / Healthcare',
  TUITION: 'Tuition / Education',
  SHOP: 'Retail Shop',
  OTHER: 'Other',
};

export const GREETING_KEYWORDS = ['hi', 'hello', 'hey', 'namaste', 'hii', 'helo', 'start', 'menu'];
