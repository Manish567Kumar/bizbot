import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { type AuthTokens, type JwtPayload } from '@bizbot/shared';

interface AuthState {
  tokens: AuthTokens | null;
  user: JwtPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setTokens: (tokens: AuthTokens, user: JwtPayload) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'bizbot_access_token';
const REFRESH_TOKEN_KEY = 'bizbot_refresh_token';

export const useAuthStore = create<AuthState>((set) => ({
  tokens: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setTokens: async (tokens, user) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    set({ tokens, user, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ tokens: null, user: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (!accessToken || !refreshToken) {
        set({ isLoading: false });
        return;
      }

      // Decode JWT payload (no verification — server validates)
      const payload = JSON.parse(atob(accessToken.split('.')[1])) as JwtPayload;
      const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : true;

      if (isExpired) {
        // Try refresh
        const { apiService } = await import('../services/api.service');
        try {
          const newTokens = await apiService.refreshToken(refreshToken);
          const newPayload = JSON.parse(atob(newTokens.accessToken.split('.')[1])) as JwtPayload;
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newTokens.accessToken);
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newTokens.refreshToken);
          set({ tokens: newTokens, user: newPayload, isAuthenticated: true, isLoading: false });
        } catch {
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          set({ isLoading: false });
        }
      } else {
        set({
          tokens: { accessToken, refreshToken, expiresIn: (payload.exp ?? 0) - Date.now() / 1000 },
          user: payload,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
