import { type BotFlow } from '@bizbot/shared';

type FlowTemplate = Omit<BotFlow, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>;

export const shopFlows: FlowTemplate[] = [
  {
    name: 'Greeting',
    isActive: true,
    priority: 100,
    trigger: { type: 'greeting' },
    response: {
      type: 'quick_reply',
      message: `🛍️ Welcome to our store! How can we help you?`,
      buttons: [
        { id: 'products', title: '📦 Products' },
        { id: 'order', title: '🛒 Place Order' },
        { id: 'hours', title: '🕐 Store Hours' },
      ],
    },
  },
  {
    name: 'Products',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['product', 'item', 'stock', 'available', 'sell', 'buy', 'catalogue', 'catalog', 'सामान', 'प्रोडक्ट'] },
    response: {
      type: 'text',
      message: `📦 *Our Products*\n\nWe carry a wide range of products!\n\nFor specific items, please tell us:\n• What you're looking for\n• Quantity needed\n• Budget\n\nWe'll check availability and get back to you with pricing! 🛍️`,
    },
  },
  {
    name: 'Order',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['order', 'buy', 'purchase', 'want', 'need', 'delivery', 'ship', 'ऑर्डर', 'खरीदना'] },
    response: {
      type: 'text',
      message: `🛒 *Place an Order*\n\nTo order, share:\n1. Product name & quantity\n2. Delivery or pick-up?\n3. Your address (for delivery)\n\n💳 We accept:\n• Cash on delivery\n• UPI / PhonePe / GPay\n• Razorpay (cards, netbanking)\n\nMinimum order for free delivery: ₹500 🛍️`,
    },
  },
  {
    name: 'Store Hours',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['hours', 'open', 'time', 'timing', 'close', 'when', 'समय', 'खुला'] },
    response: {
      type: 'text',
      message: `🕐 *Store Hours*\n\nMon–Sat: 9:00 AM – 9:00 PM\nSunday: 10:00 AM – 7:00 PM\n\n🚚 Home delivery available!\nOrders placed before 6 PM delivered same day. 🛍️`,
    },
  },
  {
    name: 'After Hours',
    isActive: true,
    priority: 110,
    trigger: { type: 'after_hours', startHour: 21, endHour: 9 },
    response: {
      type: 'text',
      message: `🌙 Our store is closed right now.\n\n⏰ We're open:\nMon–Sat: 9 AM – 9 PM\nSunday: 10 AM – 7 PM\n\nLeave your order details — we'll process it as soon as we open! 🛍️`,
    },
  },
];
