// ─── Mock database ─────────────────────────────────────────────────────────────
jest.mock('../config/database', () => ({
  prisma: {
    botFlow: { findMany: jest.fn() },
    message: { create: jest.fn() },
    analytics: { upsert: jest.fn() },
  },
}));

// ─── Mock WhatsApp send service ────────────────────────────────────────────────
jest.mock('../modules/whatsapp/whatsapp.service', () => ({
  sendTextMessage: jest.fn().mockResolvedValue('wamid.text001'),
  sendQuickReply: jest.fn().mockResolvedValue('wamid.qr001'),
}));

import { processFlow } from '../modules/bot/flow.engine';
import { prisma } from '../config/database';
import * as waService from '../modules/whatsapp/whatsapp.service';

const db = prisma as unknown as {
  botFlow: { findMany: jest.Mock };
  message: { create: jest.Mock };
  analytics: { upsert: jest.Mock };
};

const mockSendText = waService.sendTextMessage as jest.Mock;
const mockSendQuickReply = waService.sendQuickReply as jest.Mock;

const baseParams = {
  businessId: 'biz-001',
  conversationId: 'conv-001',
  customerId: 'cust-001',
  customerPhone: '+919876543210',
  phoneNumberId: 'phone-id-001',
  messageType: 'text',
};

beforeEach(() => {
  db.message.create.mockResolvedValue({ id: 'msg-001' });
  db.analytics.upsert.mockResolvedValue({});
  mockSendText.mockClear();
  mockSendQuickReply.mockClear();
});

// ─── Greeting trigger ─────────────────────────────────────────────────────────
describe('Bot engine — greeting trigger', () => {
  const greetingFlow = {
    id: 'flow-001', name: 'Greeting', isActive: true, priority: 100,
    trigger: { type: 'greeting' },
    response: { type: 'text', message: 'Welcome! How can I help?' },
  };

  beforeEach(() => { db.botFlow.findMany.mockResolvedValue([greetingFlow]); });

  const greetingInputs = ['hi', 'hello', 'hey', 'namaste', 'hii', 'start', 'menu', 'Hi', 'HELLO'];

  test.each(greetingInputs)('responds to greeting: "%s"', async (input) => {
    await processFlow({ ...baseParams, inboundContent: input });
    expect(mockSendText).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Welcome! How can I help?' }),
    );
  });

  it('does not trigger on unrelated message', async () => {
    await processFlow({ ...baseParams, inboundContent: 'where is my order' });
    expect(mockSendText).not.toHaveBeenCalled();
  });
});

// ─── Keyword trigger ──────────────────────────────────────────────────────────
describe('Bot engine — keyword trigger', () => {
  const menuFlow = {
    id: 'flow-002', name: 'Menu', isActive: true, priority: 90,
    trigger: { type: 'keyword', patterns: ['menu', 'food', 'price'] },
    response: { type: 'text', message: 'Here is our menu...' },
  };

  beforeEach(() => { db.botFlow.findMany.mockResolvedValue([menuFlow]); });

  it('matches exact keyword', async () => {
    await processFlow({ ...baseParams, inboundContent: 'menu' });
    expect(mockSendText).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Here is our menu...' }),
    );
  });

  it('matches keyword within a sentence', async () => {
    await processFlow({ ...baseParams, inboundContent: 'what is the price for chicken?' });
    expect(mockSendText).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Here is our menu...' }),
    );
  });

  it('does not match unrelated message', async () => {
    await processFlow({ ...baseParams, inboundContent: 'when do you open?' });
    expect(mockSendText).not.toHaveBeenCalled();
  });
});

// ─── Quick reply response ─────────────────────────────────────────────────────
describe('Bot engine — quick reply response', () => {
  const quickReplyFlow = {
    id: 'flow-003', name: 'Greeting QR', isActive: true, priority: 100,
    trigger: { type: 'greeting' },
    response: {
      type: 'quick_reply',
      message: 'Choose an option:',
      buttons: [{ id: 'menu', title: 'Menu' }, { id: 'hours', title: 'Hours' }],
    },
  };

  beforeEach(() => { db.botFlow.findMany.mockResolvedValue([quickReplyFlow]); });

  it('calls sendQuickReply for quick_reply response type', async () => {
    await processFlow({ ...baseParams, inboundContent: 'hi' });
    expect(mockSendQuickReply).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Choose an option:',
        buttons: expect.arrayContaining([{ id: 'menu', title: 'Menu' }]),
      }),
    );
    expect(mockSendText).not.toHaveBeenCalled();
  });
});

// ─── Priority ordering ────────────────────────────────────────────────────────
describe('Bot engine — priority ordering', () => {
  it('highest priority flow wins when multiple match', async () => {
    // Mock returns flows already sorted DESC by priority (as Prisma orderBy would)
    db.botFlow.findMany.mockResolvedValue([
      {
        id: 'flow-high', name: 'High Priority', isActive: true, priority: 100,
        trigger: { type: 'greeting' },
        response: { type: 'text', message: 'High priority response' },
      },
      {
        id: 'flow-low', name: 'Low Priority', isActive: true, priority: 10,
        trigger: { type: 'keyword', patterns: ['hi'] },
        response: { type: 'text', message: 'Low priority response' },
      },
    ]);

    await processFlow({ ...baseParams, inboundContent: 'hi' });
    expect(mockSendText).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'High priority response' }),
    );
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────
describe('Bot engine — edge cases', () => {
  it('does nothing when no flows exist', async () => {
    db.botFlow.findMany.mockResolvedValue([]);
    await processFlow({ ...baseParams, inboundContent: 'hello' });
    expect(mockSendText).not.toHaveBeenCalled();
    expect(mockSendQuickReply).not.toHaveBeenCalled();
  });

  it('does nothing when no flow matches', async () => {
    db.botFlow.findMany.mockResolvedValue([
      {
        id: 'flow-001', name: 'Menu', isActive: true, priority: 90,
        trigger: { type: 'keyword', patterns: ['menu'] },
        response: { type: 'text', message: 'Our menu...' },
      },
    ]);
    await processFlow({ ...baseParams, inboundContent: 'thank you bye' });
    expect(mockSendText).not.toHaveBeenCalled();
  });

  it('stores outbound bot message after sending', async () => {
    db.botFlow.findMany.mockResolvedValue([
      {
        id: 'flow-001', name: 'Greeting', isActive: true, priority: 100,
        trigger: { type: 'greeting' },
        response: { type: 'text', message: 'Welcome!' },
      },
    ]);

    await processFlow({ ...baseParams, inboundContent: 'hello' });

    expect(db.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conversationId: 'conv-001',
          direction: 'OUTBOUND',
          content: 'Welcome!',
        }),
      }),
    );
  });
});
