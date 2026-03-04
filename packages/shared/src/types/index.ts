// ─── Domain Enums ─────────────────────────────────────────────────────────────

export type Industry = 'RESTAURANT' | 'SALON' | 'CLINIC' | 'TUITION' | 'SHOP' | 'OTHER';
export type PlanTier = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
export type UserRole = 'OWNER' | 'ADMIN' | 'AGENT';
export type ConversationStatus = 'OPEN' | 'RESOLVED' | 'BOT';
export type Direction = 'INBOUND' | 'OUTBOUND';
export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'INTERACTIVE' | 'TEMPLATE';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

// ─── Domain Types ──────────────────────────────────────────────────────────────

export interface Business {
  id: string;
  name: string;
  phone: string;
  wabaId: string | null;
  waPhoneNumberId: string | null;
  industry: Industry;
  planTier: PlanTier;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  businessId: string;
  phone: string;
  name: string | null;
  role: UserRole;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  businessId: string;
  phone: string;
  name: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  businessId: string;
  customerId: string;
  status: ConversationStatus;
  botEnabled: boolean;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  waMessageId: string | null;
  direction: Direction;
  type: MessageType;
  content: string;
  status: MessageStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface BotFlow {
  id: string;
  businessId: string;
  name: string;
  isActive: boolean;
  priority: number;
  trigger: BotTrigger;
  response: BotResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotTrigger {
  type: 'keyword' | 'greeting' | 'after_hours' | 'default';
  patterns?: string[];
  startHour?: number;
  endHour?: number;
}

export interface BotResponse {
  type: 'text' | 'quick_reply';
  message: string;
  buttons?: Array<{ id: string; title: string }>;
}

export interface Analytics {
  id: string;
  businessId: string;
  date: Date;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  botReplies: number;
  newCustomers: number;
  openConversations: number;
  resolvedConversations: number;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;        // userId
  businessId: string;
  phone: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── WhatsApp Webhook Types ───────────────────────────────────────────────────

export interface MetaWebhookPayload {
  object: string;
  entry: MetaEntry[];
}

export interface MetaEntry {
  id: string;
  changes: MetaChange[];
}

export interface MetaChange {
  value: MetaChangeValue;
  field: string;
}

export interface MetaChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: MetaContact[];
  messages?: MetaMessage[];
  statuses?: MetaStatus[];
}

export interface MetaContact {
  profile: { name: string };
  wa_id: string;
}

export interface MetaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string };
  document?: { id: string; filename: string; mime_type: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
}

export interface MetaStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
