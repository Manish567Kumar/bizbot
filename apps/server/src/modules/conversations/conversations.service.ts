import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS, type PaginationInput } from '@bizbot/shared';

export async function listConversations(businessId: string, pagination: PaginationInput, status?: string) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    ...(status ? { status: status as 'OPEN' | 'RESOLVED' | 'BOT' } : {}),
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: { select: { id: true, phone: true, name: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { content: true, direction: true, type: true, createdAt: true },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return { data: conversations, total, page, limit, hasMore: skip + limit < total };
}

export async function getConversationMessages(
  businessId: string,
  conversationId: string,
  pagination: PaginationInput,
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, businessId },
  });

  if (!conversation) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return { data: messages.reverse(), total, page, limit, hasMore: skip + limit < total };
}

export async function updateConversationStatus(
  businessId: string,
  conversationId: string,
  status: 'OPEN' | 'RESOLVED',
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, businessId },
  });

  if (!conversation) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');

  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status },
  });
}

export async function toggleBot(businessId: string, conversationId: string, enabled: boolean) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, businessId },
  });

  if (!conversation) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Conversation not found');

  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      botEnabled: enabled,
      status: enabled ? 'BOT' : 'OPEN',
    },
  });
}
