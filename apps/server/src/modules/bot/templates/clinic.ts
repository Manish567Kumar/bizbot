import { type BotFlow } from '@bizbot/shared';

type FlowTemplate = Omit<BotFlow, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>;

export const clinicFlows: FlowTemplate[] = [
  {
    name: 'Greeting',
    isActive: true,
    priority: 100,
    trigger: { type: 'greeting' },
    response: {
      type: 'quick_reply',
      message: `🏥 Welcome! How can we assist you today?`,
      buttons: [
        { id: 'appointment', title: '📅 Book Appointment' },
        { id: 'doctors', title: '👨‍⚕️ Our Doctors' },
        { id: 'hours', title: '🕐 Clinic Hours' },
      ],
    },
  },
  {
    name: 'Appointment',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['appointment', 'book', 'consult', 'doctor', 'visit', 'checkup', 'अपॉइंटमेंट', 'डॉक्टर'] },
    response: {
      type: 'text',
      message: `📅 *Book an Appointment*\n\nPlease share:\n1. Patient name\n2. Preferred date & time\n3. Reason for visit\n4. Contact number\n\n⚠️ For emergencies, please call us directly. We'll confirm your appointment within 1 hour. 🙏`,
    },
  },
  {
    name: 'Doctors',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['doctor', 'specialist', 'physicians', 'staff', 'dr', 'डॉक्टर'] },
    response: {
      type: 'text',
      message: `👨‍⚕️ *Our Medical Team*\n\nOur qualified doctors are available for:\n• General Medicine\n• Pediatrics\n• Gynecology\n• Orthopedics\n\nFor specialist availability, please reply with the specialty you need! 🏥`,
    },
  },
  {
    name: 'Clinic Hours',
    isActive: true,
    priority: 90,
    trigger: { type: 'keyword', patterns: ['hours', 'open', 'time', 'timing', 'when', 'schedule', 'समय', 'खुलना'] },
    response: {
      type: 'text',
      message: `🕐 *Clinic Hours*\n\nMon–Sat: 9:00 AM – 1:00 PM & 5:00 PM – 8:00 PM\nSunday: 10:00 AM – 12:00 PM (Emergency only)\n\n📞 For emergencies outside hours, please call us directly. 🏥`,
    },
  },
  {
    name: 'After Hours',
    isActive: true,
    priority: 110,
    trigger: { type: 'after_hours', startHour: 20, endHour: 9 },
    response: {
      type: 'text',
      message: `🌙 The clinic is currently closed.\n\n⚠️ *Medical Emergency?* Please call emergency services (112) or visit the nearest hospital immediately.\n\nFor appointments, we're open:\nMon–Sat: 9 AM–1 PM & 5 PM–8 PM\n\nYour message has been noted. 🙏`,
    },
  },
];
