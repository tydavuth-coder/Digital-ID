import axios from "axios";
import * as SecureStore from "expo-secure-store";

type BaseUrls = {
  apiBaseUrl: string;
  trpcBaseUrl: string;
};

function normalizeBaseUrl(rawBaseUrl: string): BaseUrls {
  const trimmed = rawBaseUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/api/trpc")) {
    const apiBaseUrl = trimmed.replace(/\/api\/trpc$/, "/api");
    return { apiBaseUrl, trpcBaseUrl: trimmed };
  }
  if (trimmed.endsWith("/api")) {
    return { apiBaseUrl: trimmed, trpcBaseUrl: `${trimmed}/trpc` };
  }
  const apiBaseUrl = `${trimmed}/api`;
  return { apiBaseUrl, trpcBaseUrl: `${apiBaseUrl}/trpc` };
}

function getRawBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL || "https://id.efimef.org";
}

export function buildApiBaseUrl() {
  return normalizeBaseUrl(getRawBaseUrl()).apiBaseUrl;
}

export function buildTrpcBaseUrl() {
  return normalizeBaseUrl(getRawBaseUrl()).trpcBaseUrl;
}

export const api = axios.create({
  baseURL: buildApiBaseUrl(),
  timeout: 30000,
});
api.interceptors.request.use(async (config) => {
  const accessToken = await SecureStore.getItemAsync("accessToken");
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
