import { type BotFlow } from '@bizbot/shared';

type FlowTemplate = Omit<BotFlow, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>;

export const restaurantFlows: FlowTemplate[] = [
  {
    name: 'Greeting',
    isActive: true,
    priority: 100,
    trigger: { type: 'greeting' },
    response: {
      type: 'quick_reply',
      message: `🍽️ Welcome to our restaurant! How can we help you today?`,
      buttons: [
        { id: 'menu', title: '📋 View Menu' },
        { id: 'hours', title: '🕐 Opening Hours' },
        { id: 'reserve', title: '🪑 Reserve Table' },
      ],
    },
  },
  {
    name: 'Menu',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['menu', 'food', 'items', 'price', 'rate', 'dishes', 'खाना', 'मेन्यू'] },
    response: {
      type: 'text',
      message: `📋 *Our Menu*\n\nPlease visit our website or ask our team for the full menu.\n\nFor orders, reply with your items and we'll confirm availability! 🙏`,
    },
  },
  {
    name: 'Opening Hours',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['hours', 'open', 'time', 'timing', 'close', 'when', 'schedule', 'समय'] },
    response: {
      type: 'text',
      message: `🕐 *Opening Hours*\n\n🌅 Lunch: 12:00 PM – 3:30 PM\n🌆 Dinner: 7:00 PM – 10:30 PM\n\n📅 Open 7 days a week\n\nFor reservations, call us or reply "Reserve"!`,
    },
  },
  {
    name: 'Table Reservation',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['book', 'reserve', 'table', 'reservation', 'seat', 'booking', 'बुकिंग'] },
    response: {
      type: 'text',
      message: `🪑 *Table Reservation*\n\nPlease share:\n1. Date & Time\n2. Number of guests\n3. Your name\n\nOur team will confirm your reservation within 30 minutes! 🙏`,
    },
  },
  {
    name: 'After Hours',
    isActive: true,
    priority: 110,
    trigger: { type: 'after_hours', startHour: 23, endHour: 11 },
    response: {
      type: 'text',
      message: `🌙 We're currently closed. Our hours are:\n\nLunch: 12 PM – 3:30 PM\nDinner: 7 PM – 10:30 PM\n\nYour message has been noted — we'll respond when we open! 🙏`,
    },
  },
];
