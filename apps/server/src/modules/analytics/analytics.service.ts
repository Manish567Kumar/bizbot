import { prisma } from '../../config/database';

export async function getDashboardStats(businessId: string, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [stats, conversations] = await Promise.all([
    prisma.analytics.findMany({
      where: { businessId, date: { gte: since } },
      orderBy: { date: 'asc' },
    }),
    prisma.conversation.groupBy({
      by: ['status'],
      where: { businessId },
      _count: { id: true },
    }),
  ]);

  const totals = stats.reduce(
    (acc, s) => ({
      totalMessages: acc.totalMessages + s.totalMessages,
      botReplies: acc.botReplies + s.botReplies,
      newCustomers: acc.newCustomers + s.newCustomers,
    }),
    { totalMessages: 0, botReplies: 0, newCustomers: 0 },
  );

  const conversationsByStatus = Object.fromEntries(
    conversations.map((c) => [c.status, c._count.id]),
  );

  return { totals, timeSeries: stats, conversationsByStatus };
}

export async function aggregateDailyAnalytics(businessId: string, date: Date): Promise<void> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [totalMessages, inboundMessages, outboundMessages, botReplies, newCustomers, openConvs, resolvedConvs] =
    await Promise.all([
      prisma.message.count({
        where: { conversation: { businessId }, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.message.count({
        where: {
          conversation: { businessId },
          direction: 'INBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.message.count({
        where: {
          conversation: { businessId },
          direction: 'OUTBOUND',
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.message.count({
        where: {
          conversation: { businessId },
          direction: 'OUTBOUND',
          metadata: { path: ['source'], equals: 'bot' },
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.customer.count({
        where: { businessId, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.conversation.count({ where: { businessId, status: 'OPEN' } }),
      prisma.conversation.count({ where: { businessId, status: 'RESOLVED' } }),
    ]);

  await prisma.analytics.upsert({
    where: { businessId_date: { businessId, date: startOfDay } },
    create: {
      businessId, date: startOfDay,
      totalMessages, inboundMessages, outboundMessages, botReplies,
      newCustomers, openConversations: openConvs, resolvedConversations: resolvedConvs,
    },
    update: {
      totalMessages, inboundMessages, outboundMessages, botReplies,
      newCustomers, openConversations: openConvs, resolvedConversations: resolvedConvs,
    },
  });
}
