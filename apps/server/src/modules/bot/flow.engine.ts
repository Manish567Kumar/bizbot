import { prisma } from '../../config/database';
import { sendTextMessage, sendQuickReply } from '../whatsapp/whatsapp.service';
import { GREETING_KEYWORDS, type BotTrigger, type BotResponse } from '@bizbot/shared';

interface ProcessFlowParams {
  businessId: string;
  conversationId: string;
  customerId: string;
  customerPhone: string;
  phoneNumberId: string;
  inboundContent: string;
  messageType: string;
}

export async function processFlow(params: ProcessFlowParams): Promise<void> {
  const { businessId, conversationId, phoneNumberId, customerPhone, inboundContent } = params;

  // Load active flows sorted by priority DESC
  const flows = await prisma.botFlow.findMany({
    where: { businessId, isActive: true },
    orderBy: { priority: 'desc' },
  });

  if (flows.length === 0) return;

  const content = inboundContent.toLowerCase().trim();
  const currentHour = new Date().getHours();

  let matchedResponse: BotResponse | null = null;

  for (const flow of flows) {
    const trigger = flow.trigger as unknown as BotTrigger;

    if (matchesTrigger(trigger, content, currentHour)) {
      matchedResponse = flow.response as unknown as BotResponse;
      break; // highest priority match wins
    }
  }

  // Fallback to default flow if no match
  if (!matchedResponse) {
    const defaultFlow = flows.find((f) => (f.trigger as unknown as BotTrigger).type === 'default');
    if (defaultFlow) {
      matchedResponse = defaultFlow.response as unknown as BotResponse;
    }
  }

  if (!matchedResponse) return;

  // Send response
  const recipientPhone = customerPhone.replace('+', '');
  let waMessageId: string | undefined;

  try {
    if (matchedResponse.type === 'quick_reply' && matchedResponse.buttons?.length) {
      waMessageId = await sendQuickReply({
        phoneNumberId,
        to: recipientPhone,
        message: matchedResponse.message,
        buttons: matchedResponse.buttons,
      });
    } else {
      waMessageId = await sendTextMessage({
        phoneNumberId,
        to: recipientPhone,
        message: matchedResponse.message,
      });
    }
  } catch (err) {
    console.error('[BotEngine] Failed to send reply:', err);
    return;
  }

  // Store outbound bot message
  await prisma.message.create({
    data: {
      conversationId,
      waMessageId: waMessageId ?? null,
      direction: 'OUTBOUND',
      type: matchedResponse.type === 'quick_reply' ? 'INTERACTIVE' : 'TEXT',
      content: matchedResponse.message,
      status: 'SENT',
      metadata: { source: 'bot' },
    },
  });

  // Update analytics
  await incrementBotReply(businessId);
}

// ─── Trigger Matching ─────────────────────────────────────────────────────────

function matchesTrigger(trigger: BotTrigger, content: string, currentHour: number): boolean {
  switch (trigger.type) {
    case 'greeting':
      return GREETING_KEYWORDS.some((kw) => content === kw || content.startsWith(kw));

    case 'keyword':
      return (trigger.patterns ?? []).some((pattern) =>
        content.includes(pattern.toLowerCase()),
      );

    case 'after_hours': {
      const { startHour = 22, endHour = 9 } = trigger;
      if (startHour > endHour) {
        return currentHour >= startHour || currentHour < endHour;
      }
      return currentHour >= startHour && currentHour < endHour;
    }

    case 'default':
      return false; // used as fallback only, not matched directly

    default:
      return false;
  }
}

// ─── Analytics Increment ──────────────────────────────────────────────────────

async function incrementBotReply(businessId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.analytics.upsert({
    where: { businessId_date: { businessId, date: today } },
    create: {
      businessId,
      date: today,
      botReplies: 1,
      outboundMessages: 1,
      totalMessages: 1,
    },
    update: {
      botReplies: { increment: 1 },
      outboundMessages: { increment: 1 },
      totalMessages: { increment: 1 },
    },
  });
}

// ─── Seed Industry Templates ──────────────────────────────────────────────────

export async function seedIndustryTemplates(businessId: string, industry: string): Promise<void> {
  const industryMap: Record<string, () => Promise<{ default?: unknown; [key: string]: unknown }>> = {
    RESTAURANT: () => import('./templates/restaurant'),
    SALON:      () => import('./templates/salon'),
    CLINIC:     () => import('./templates/clinic'),
    TUITION:    () => import('./templates/tuition'),
    SHOP:       () => import('./templates/shop'),
  };

  const loader = industryMap[industry];
  if (!loader) return;

  const module = await loader();
  const flows = (Object.values(module)[0] as Array<Record<string, unknown>>) ?? [];

  await prisma.botFlow.deleteMany({ where: { businessId } });

  for (const flow of flows) {
    await prisma.botFlow.create({
      data: {
        businessId,
        name: flow.name as string,
        isActive: flow.isActive as boolean,
        priority: flow.priority as number,
        trigger: flow.trigger as object,
        response: flow.response as object,
      },
    });
  }
}
