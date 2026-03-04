import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { type AuthTokens, type ApiResponse } from '@bizbot/shared';

const BASE_URL = (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl ?? 'http://localhost:3000';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach auth token from store on every request
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const { useAuthStore } = await import('../store/auth.store');
    const token = useAuthStore.getState().tokens?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

const client = createApiClient();

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function sendOtp(phone: string): Promise<void> {
  await client.post('/auth/send-otp', { phone });
}

async function verifyOtp(phone: string, otp: string): Promise<AuthTokens> {
  const res = await client.post<ApiResponse<AuthTokens>>('/auth/verify-otp', { phone, otp });
  return res.data.data!;
}

async function refreshToken(refreshToken: string): Promise<AuthTokens> {
  const res = await client.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
  return res.data.data!;
}

// ─── Business ─────────────────────────────────────────────────────────────────
async function getBusinessProfile() {
  const res = await client.get<ApiResponse<unknown>>('/business/profile');
  return res.data.data;
}

async function updateBusinessProfile(data: { name: string; industry: string }) {
  const res = await client.patch<ApiResponse<unknown>>('/business/profile', data);
  return res.data.data;
}

// ─── Conversations ────────────────────────────────────────────────────────────
async function listConversations(page = 1, status?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (status) params.set('status', status);
  const res = await client.get<ApiResponse<unknown>>(`/conversations?${params}`);
  return res.data.data;
}

async function getMessages(conversationId: string, page = 1) {
  const res = await client.get<ApiResponse<unknown>>(`/conversations/${conversationId}/messages?page=${page}&limit=50`);
  return res.data.data;
}

async function toggleBot(conversationId: string, enabled: boolean) {
  const res = await client.patch<ApiResponse<unknown>>(`/conversations/${conversationId}/bot`, { enabled });
  return res.data.data;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
async function getDashboardStats(days = 7) {
  const res = await client.get<ApiResponse<unknown>>(`/analytics/dashboard?days=${days}`);
  return res.data.data;
}

export const apiService = {
  sendOtp,
  verifyOtp,
  refreshToken,
  getBusinessProfile,
  updateBusinessProfile,
  listConversations,
  getMessages,
  toggleBot,
  getDashboardStats,
};
