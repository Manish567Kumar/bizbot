import { prisma } from '../../config/database';
import { processFlow } from '../bot/flow.engine';
import { markMessageRead } from './whatsapp.service';
import { type MetaMessage, type MetaContact } from '@bizbot/shared';

interface ProcessMessageParams {
  phoneNumberId: string;
  message: MetaMessage;
  contact: MetaContact | undefined;
}

export async function processIncomingMessage({
  phoneNumberId,
  message,
  contact,
}: ProcessMessageParams): Promise<void> {
  // 1. Find business by WhatsApp phone number ID
  const business = await prisma.business.findFirst({
    where: { waPhoneNumberId: phoneNumberId, isActive: true },
    select: { id: true, name: true, waPhoneNumberId: true },
  });

  if (!business) {
    console.warn(`[Webhook] No active business for phoneNumberId: ${phoneNumberId}`);
    return;
  }

  // 2. Find or create customer
  const customerPhone = `+${message.from}`;
  const customer = await prisma.customer.upsert({
    where: { businessId_phone: { businessId: business.id, phone: customerPhone } },
    create: {
      businessId: business.id,
      phone: customerPhone,
      name: contact?.profile?.name ?? null,
      lastSeenAt: new Date(),
    },
    update: {
      name: contact?.profile?.name ?? undefined,
      lastSeenAt: new Date(),
    },
  });

  // 3. Find or create conversation (one open conversation per customer)
  let conversation = await prisma.conversation.findFirst({
    where: {
      businessId: business.id,
      customerId: customer.id,
      status: { in: ['OPEN', 'BOT'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        status: 'BOT',
        botEnabled: true,
        lastMessageAt: new Date(),
      },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  // 4. Extract message content
  const content = extractContent(message);

  // 5. Store inbound message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      waMessageId: message.id,
      direction: 'INBOUND',
      type: mapMessageType(message.type),
      content,
      status: 'DELIVERED',
      metadata: { raw: message } as object,
    },
  });

  // 6. Mark as read
  if (business.waPhoneNumberId) {
    await markMessageRead(business.waPhoneNumberId, message.id).catch(() => undefined);
  }

  // 7. Run bot engine if bot is enabled
  if (conversation.botEnabled) {
    await processFlow({
      businessId: business.id,
      conversationId: conversation.id,
      customerId: customer.id,
      customerPhone,
      phoneNumberId,
      inboundContent: content,
      messageType: message.type,
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractContent(message: MetaMessage): string {
  if (message.text) return message.text.body;
  if (message.image) return message.image.caption ?? '[Image]';
  if (message.audio) return '[Audio]';
  if (message.video) return message.video.caption ?? '[Video]';
  if (message.document) return message.document.filename ?? '[Document]';
  if (message.interactive) {
    const reply = message.interactive.button_reply ?? message.interactive.list_reply;
    return reply ? reply.title : '[Interactive]';
  }
  return '[Unsupported message type]';
}

function mapMessageType(type: string): 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'INTERACTIVE' | 'TEMPLATE' {
  const map: Record<string, 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'INTERACTIVE' | 'TEMPLATE'> = {
    text: 'TEXT',
    image: 'IMAGE',
    audio: 'AUDIO',
    video: 'VIDEO',
    document: 'DOCUMENT',
    interactive: 'INTERACTIVE',
    template: 'TEMPLATE',
  };
  return map[type] ?? 'TEXT';
}
