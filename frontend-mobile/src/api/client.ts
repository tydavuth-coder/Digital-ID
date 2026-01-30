import axios from "axios";
import * as SecureStore from "expo-secure-store";

type BaseUrls = {
  apiBaseUrl: string;
  trpcBaseUrl: string;
};

function normalizeBaseUrl(rawBaseUrl: string): BaseUrls {
  const trimmed = rawBaseUrl.replace(/\/+$/, "");
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, "");

    if (path.endsWith("/api/trpc")) {
      const apiBaseUrl = `${parsed.origin}${path.replace(/\/api\/trpc$/, "/api")}`;
      return { apiBaseUrl, trpcBaseUrl: `${parsed.origin}${path}` };
    }

    if (path.endsWith("/api")) {
      const apiBaseUrl = `${parsed.origin}${path}`;
      return { apiBaseUrl, trpcBaseUrl: `${apiBaseUrl}/trpc` };
    }

    const apiBaseUrl = `${parsed.origin}/api`;
    return { apiBaseUrl, trpcBaseUrl: `${apiBaseUrl}/trpc` };
  } catch {
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

export function getApiBaseUrls() {
  const rawBaseUrl = getRawBaseUrl();
  let origin = rawBaseUrl.replace(/\/+$/, "");
  try {
    origin = new URL(origin).origin;
  } catch {
    // keep fallback origin as-is for non-URL values
  }
  return {
    rawBaseUrl,
    origin,
    ...normalizeBaseUrl(rawBaseUrl),
  };
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