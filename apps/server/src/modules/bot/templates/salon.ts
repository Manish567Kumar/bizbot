import { type BotFlow } from '@bizbot/shared';

type FlowTemplate = Omit<BotFlow, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>;

export const salonFlows: FlowTemplate[] = [
  {
    name: 'Greeting',
    isActive: true,
    priority: 100,
    trigger: { type: 'greeting' },
    response: {
      type: 'quick_reply',
      message: `💇 Welcome! How can we help you today?`,
      buttons: [
        { id: 'services', title: '✨ Our Services' },
        { id: 'appointment', title: '📅 Book Appointment' },
        { id: 'pricing', title: '💰 Price List' },
      ],
    },
  },
  {
    name: 'Services',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['services', 'what', 'offer', 'treatment', 'hair', 'facial', 'manicure', 'पेडीक्योर', 'सर्विस'] },
    response: {
      type: 'text',
      message: `✨ *Our Services*\n\n💇 Hair: Cut, Color, Smoothing, Keratin\n💅 Nails: Manicure, Pedicure, Gel Nails\n🧖 Skin: Facials, Clean-up, Bleach\n💆 Body: Waxing, Threading\n\nFor pricing, reply "Price"! 💛`,
    },
  },
  {
    name: 'Appointment',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['book', 'appointment', 'slot', 'available', 'schedule', 'visit', 'come', 'अपॉइंटमेंट', 'बुकिंग'] },
    response: {
      type: 'text',
      message: `📅 *Book an Appointment*\n\nPlease share:\n1. Service you want\n2. Preferred date & time\n3. Your name\n\nWe're open Mon–Sat: 10 AM – 7 PM\nSunday: 11 AM – 5 PM\n\nWe'll confirm shortly! 💛`,
    },
  },
  {
    name: 'Pricing',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['price', 'cost', 'rate', 'charge', 'how much', 'fees', 'pricing', 'रेट', 'कीमत'] },
    response: {
      type: 'text',
      message: `💰 *Price List*\n\nHaircut: ₹200–₹500\nColor (Basic): ₹800–₹1500\nFacial: ₹500–₹1200\nManicure: ₹300–₹600\nWaxing (Full): ₹800–₹1200\n\nPrices may vary. DM us for exact quote! 💛`,
    },
  },
  {
    name: 'After Hours',
    isActive: true,
    priority: 110,
    trigger: { type: 'after_hours', startHour: 19, endHour: 10 },
    response: {
      type: 'text',
      message: `🌙 We're closed right now!\n\n⏰ We're open:\nMon–Sat: 10 AM – 7 PM\nSunday: 11 AM – 5 PM\n\nLeave your message and we'll get back to you! 💛`,
    },
  },
];
