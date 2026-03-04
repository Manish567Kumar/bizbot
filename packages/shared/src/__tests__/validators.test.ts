import { IndianPhoneSchema, OtpSchema, SendOtpSchema, VerifyOtpSchema, PaginationSchema } from '../validators';

describe('IndianPhoneSchema', () => {
  const valid = [
    ['bare 10-digit', '9876543210'],
    ['+91 prefix', '+919876543210'],
    ['91 prefix', '919876543210'],
    ['6-series', '6123456789'],
    ['7-series', '7999999999'],
    ['8-series', '8012345678'],
  ];

  const invalid = [
    ['too short', '98765'],
    ['starts with 5', '5123456789'],
    ['starts with 1', '1234567890'],
    ['landline-style', '0112345678'],
    ['empty', ''],
    ['non-numeric', 'abcdefghij'],
  ];

  test.each(valid)('accepts %s: %s', (_label, phone) => {
    const result = IndianPhoneSchema.safeParse(phone);
    expect(result.success).toBe(true);
  });

  test.each(invalid)('rejects %s: %s', (_label, phone) => {
    const result = IndianPhoneSchema.safeParse(phone);
    expect(result.success).toBe(false);
  });

  it('normalises bare 10-digit to +91 format', () => {
    const result = IndianPhoneSchema.safeParse('9876543210');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('+919876543210');
  });

  it('normalises +91 prefix correctly', () => {
    const result = IndianPhoneSchema.safeParse('+919876543210');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('+919876543210');
  });
});

describe('OtpSchema', () => {
  it('accepts valid 6-digit OTP', () => {
    expect(OtpSchema.safeParse('123456').success).toBe(true);
    expect(OtpSchema.safeParse('000000').success).toBe(true);
  });

  it('rejects OTP with wrong length', () => {
    expect(OtpSchema.safeParse('12345').success).toBe(false);    // 5 digits
    expect(OtpSchema.safeParse('1234567').success).toBe(false);  // 7 digits
  });

  it('rejects non-numeric OTP', () => {
    expect(OtpSchema.safeParse('12345a').success).toBe(false);
    expect(OtpSchema.safeParse('abcdef').success).toBe(false);
  });
});

describe('SendOtpSchema', () => {
  it('parses valid phone', () => {
    const result = SendOtpSchema.safeParse({ phone: '9876543210' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe('+919876543210');
  });

  it('rejects missing phone', () => {
    expect(SendOtpSchema.safeParse({}).success).toBe(false);
  });
});

describe('VerifyOtpSchema', () => {
  it('parses valid phone + OTP', () => {
    const result = VerifyOtpSchema.safeParse({ phone: '9876543210', otp: '123456' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('+919876543210');
      expect(result.data.otp).toBe('123456');
    }
  });

  it('rejects invalid otp', () => {
    const result = VerifyOtpSchema.safeParse({ phone: '9876543210', otp: '12345' });
    expect(result.success).toBe(false);
  });
});

describe('PaginationSchema', () => {
  it('uses defaults', () => {
    const result = PaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerces string numbers', () => {
    const result = PaginationSchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('clamps limit to max 100', () => {
    const result = PaginationSchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });
});
