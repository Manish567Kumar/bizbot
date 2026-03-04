import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const en = {
  translation: {
    auth: {
      title: 'BizBot',
      subtitle: 'WhatsApp Automation for Your Business',
      phonePlaceholder: 'Enter your mobile number',
      sendOtp: 'Send OTP',
      otpTitle: 'Enter OTP',
      otpSubtitle: 'We sent a 6-digit code to {{phone}}',
      verify: 'Verify & Login',
      resend: 'Resend OTP',
      resendIn: 'Resend in {{seconds}}s',
      invalidPhone: 'Enter a valid 10-digit Indian mobile number',
    },
    dashboard: {
      title: 'Dashboard',
      totalMessages: 'Total Messages',
      botReplies: 'Bot Replies',
      newCustomers: 'New Customers',
      openConversations: 'Open Conversations',
      last7Days: 'Last 7 days',
    },
    conversations: {
      title: 'Inbox',
      empty: 'No conversations yet',
      bot: 'Bot',
      open: 'Open',
      resolved: 'Resolved',
      toggleBot: 'Toggle Bot',
      resolve: 'Resolve',
    },
    settings: {
      title: 'Settings',
      businessName: 'Business Name',
      industry: 'Industry',
      whatsapp: 'WhatsApp Setup',
      logout: 'Logout',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      loading: 'Loading...',
      error: 'Something went wrong',
      retry: 'Retry',
    },
  },
};

const hi = {
  translation: {
    auth: {
      title: 'BizBot',
      subtitle: 'अपने व्यवसाय के लिए WhatsApp ऑटोमेशन',
      phonePlaceholder: 'मोबाइल नंबर दर्ज करें',
      sendOtp: 'OTP भेजें',
      otpTitle: 'OTP दर्ज करें',
      otpSubtitle: '{{phone}} पर 6 अंकों का कोड भेजा गया',
      verify: 'वेरिफाई करें',
      resend: 'OTP फिर भेजें',
      resendIn: '{{seconds}}s में फिर भेजें',
      invalidPhone: 'सही 10 अंकों का मोबाइल नंबर दर्ज करें',
    },
    dashboard: {
      title: 'डैशबोर्ड',
      totalMessages: 'कुल संदेश',
      botReplies: 'Bot रिप्लाई',
      newCustomers: 'नए ग्राहक',
      openConversations: 'खुली बातचीत',
      last7Days: 'पिछले 7 दिन',
    },
    conversations: {
      title: 'इनबॉक्स',
      empty: 'अभी कोई बातचीत नहीं',
      bot: 'Bot',
      open: 'खुला',
      resolved: 'सुलझा',
      toggleBot: 'Bot टॉगल',
      resolve: 'सुलझाएं',
    },
    settings: {
      title: 'सेटिंग्स',
      businessName: 'व्यवसाय का नाम',
      industry: 'उद्योग',
      whatsapp: 'WhatsApp सेटअप',
      logout: 'लॉगआउट',
    },
    common: {
      save: 'सेव करें',
      cancel: 'रद्द करें',
      loading: 'लोड हो रहा है...',
      error: 'कुछ गलत हो गया',
      retry: 'फिर कोशिश करें',
    },
  },
};

i18n.use(initReactI18next).init({
  resources: { en, hi },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
