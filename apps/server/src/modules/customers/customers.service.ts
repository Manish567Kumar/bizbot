import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS, type PaginationInput } from '@bizbot/shared';

export async function listCustomers(businessId: string, pagination: PaginationInput) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { businessId },
      orderBy: { lastSeenAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, phone: true, name: true, tags: true,
        lastSeenAt: true, createdAt: true,
        _count: { select: { conversations: true } },
      },
    }),
    prisma.customer.count({ where: { businessId } }),
  ]);

  return { data: customers, total, page, limit, hasMore: skip + limit < total };
}

export async function getCustomer(businessId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: {
      conversations: {
        take: 5,
        orderBy: { lastMessageAt: 'desc' },
        select: { id: true, status: true, lastMessageAt: true, botEnabled: true },
      },
    },
  });

  if (!customer) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Customer not found');
  return customer;
}

export async function updateCustomerTags(businessId: string, customerId: string, tags: string[]) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });

  if (!customer) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Customer not found');

  return prisma.customer.update({
    where: { id: customerId },
    data: { tags },
  });
}
