import axios, { AxiosInstance } from 'axios';
import { env } from '../../config/env';
import { META_API_BASE } from '@bizbot/shared';

interface SendTextParams {
  phoneNumberId: string;
  to: string;
  message: string;
}

interface SendQuickReplyParams {
  phoneNumberId: string;
  to: string;
  message: string;
  buttons: Array<{ id: string; title: string }>;
}

interface SendTemplateParams {
  phoneNumberId: string;
  to: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
}

// Singleton axios instance for Meta Graph API
function createMetaClient(): AxiosInstance {
  return axios.create({
    baseURL: `${META_API_BASE}/${env.META_API_VERSION}`,
    headers: {
      Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
}

const metaClient = createMetaClient();

export async function sendTextMessage({ phoneNumberId, to, message }: SendTextParams): Promise<string> {
  const response = await metaClient.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: message },
  });
  return (response.data as { messages: Array<{ id: string }> }).messages[0].id;
}

export async function sendQuickReply({ phoneNumberId, to, message, buttons }: SendQuickReplyParams): Promise<string> {
  const response = await metaClient.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: message },
      action: {
        buttons: buttons.slice(0, 3).map((btn) => ({
          type: 'reply',
          reply: { id: btn.id, title: btn.title.slice(0, 20) },
        })),
      },
    },
  });
  return (response.data as { messages: Array<{ id: string }> }).messages[0].id;
}

export async function sendTemplate({ phoneNumberId, to, templateName, languageCode, components }: SendTemplateParams): Promise<string> {
  const response = await metaClient.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components ?? [],
    },
  });
  return (response.data as { messages: Array<{ id: string }> }).messages[0].id;
}

export async function markMessageRead(phoneNumberId: string, messageId: string): Promise<void> {
  await metaClient.post(`/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  });
}
