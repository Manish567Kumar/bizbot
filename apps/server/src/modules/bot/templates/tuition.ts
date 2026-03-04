import { type BotFlow } from '@bizbot/shared';

type FlowTemplate = Omit<BotFlow, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>;

export const tuitionFlows: FlowTemplate[] = [
  {
    name: 'Greeting',
    isActive: true,
    priority: 100,
    trigger: { type: 'greeting' },
    response: {
      type: 'quick_reply',
      message: `📚 Welcome! How can we help you today?`,
      buttons: [
        { id: 'courses', title: '📖 Our Courses' },
        { id: 'fees', title: '💰 Fee Structure' },
        { id: 'enroll', title: '✏️ Enroll Now' },
      ],
    },
  },
  {
    name: 'Courses',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['course', 'subject', 'class', 'teach', 'batch', 'std', 'grade', 'कोर्स', 'क्लास', 'विषय'] },
    response: {
      type: 'text',
      message: `📖 *Our Courses*\n\n🔢 Mathematics (Grade 6–12)\n🔬 Science (Grade 6–10)\n🧪 Physics, Chemistry, Biology (11–12)\n💻 Computer Science\n📝 English & Hindi\n\nWe offer both individual & group batches.\nReply "Fees" for fee structure! 📚`,
    },
  },
  {
    name: 'Fees',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['fee', 'fees', 'cost', 'charge', 'price', 'rate', 'how much', 'फीस', 'कीमत'] },
    response: {
      type: 'text',
      message: `💰 *Fee Structure*\n\nIndividual Tuition: ₹2,000–₹4,000/month\nGroup Batch (5–8 students): ₹800–₹1,500/month\nOnline Classes: ₹1,000–₹2,500/month\n\n✅ First demo class FREE!\n\nReply "Enroll" to register. 📚`,
    },
  },
  {
    name: 'Enrollment',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['enroll', 'join', 'register', 'admission', 'demo', 'start', 'दाखिला', 'एडमिशन'] },
    response: {
      type: 'text',
      message: `✏️ *Enrollment*\n\nTo enroll, please share:\n1. Student name\n2. Class / Grade\n3. Subject(s) needed\n4. Preferred timing\n\nWe'll arrange a FREE demo class first! Our team will contact you within 2 hours. 📚`,
    },
  },
  {
    name: 'After Hours',
    isActive: true,
    priority: 110,
    trigger: { type: 'after_hours', startHour: 21, endHour: 8 },
    response: {
      type: 'text',
      message: `🌙 Our office is closed right now.\n\nWe reply during:\n⏰ Mon–Sat: 8 AM – 9 PM\nSunday: 10 AM – 6 PM\n\nYour inquiry has been noted — we'll respond first thing in the morning! 📚`,
    },
  },
];
