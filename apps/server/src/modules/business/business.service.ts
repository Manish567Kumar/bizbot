import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS, type BusinessProfileInput } from '@bizbot/shared';
import { seedIndustryTemplates } from '../bot/flow.engine';

export async function getBusinessProfile(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true, name: true, phone: true, wabaId: true, waPhoneNumberId: true,
      industry: true, planTier: true, isActive: true, settings: true,
      createdAt: true, updatedAt: true,
    },
  });

  if (!business) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Business not found');
  return business;
}

export async function updateBusinessProfile(businessId: string, input: BusinessProfileInput) {
  const existing = await prisma.business.findUnique({ where: { id: businessId }, select: { industry: true } });
  if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Business not found');

  const business = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name,
      industry: input.industry,
      settings: input.settings ?? undefined,
    },
  });

  // If industry changed, seed new bot templates
  if (existing.industry !== input.industry) {
    await seedIndustryTemplates(businessId, input.industry).catch((err) =>
      console.error('[Business] Failed to seed templates:', err),
    );
  }

  return business;
}

export async function updateWhatsAppConfig(
  businessId: string,
  config: { wabaId: string; waPhoneNumberId: string },
) {
  return prisma.business.update({
    where: { id: businessId },
    data: { wabaId: config.wabaId, waPhoneNumberId: config.waPhoneNumberId },
  });
}
