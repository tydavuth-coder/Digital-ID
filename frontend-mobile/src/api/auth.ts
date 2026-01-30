import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { api, buildApiBaseUrl } from "./client";

export type AuthUser = {
  id: string;
  email?: string;
  phone?: string;
  nameKh?: string;
  nameEn?: string;
  status?: string;
};

async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync("accessToken", accessToken);
  await SecureStore.setItemAsync("refreshToken", refreshToken);
}

export async function logout() {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
}

/** PIN LOGIN */
export async function loginWithPin(phone: string, pin: string): Promise<AuthUser> {
  const res = await api.post("/auth/pin/login", { phone, pin });
  const { accessToken, refreshToken, user } = res.data ?? {};
  if (!accessToken || !refreshToken) throw new Error("Missing tokens from backend");
  await saveTokens(accessToken, refreshToken);
  return user;
}

/** GOOGLE LOGIN (Mobile) */
export async function loginWithGoogleIdToken(idToken: string): Promise<AuthUser> {
  const res = await api.post("/auth/google", { idToken });
  const { accessToken, refreshToken, user } = res.data ?? {};
  if (!accessToken || !refreshToken) throw new Error("Missing tokens from backend");
  await saveTokens(accessToken, refreshToken);
  return user;
}

/** AUTO LOGIN (Refresh) */
export async function refreshSession(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) return false;

  // use plain axios to avoid interceptor recursion
  const baseURL = buildApiBaseUrl();
  const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, { timeout: 15000 });

  const { accessToken, refreshToken: newRefresh } = res.data ?? {};
  if (!accessToken || !newRefresh) throw new Error("Missing refresh response tokens");

  await saveTokens(accessToken, newRefresh);
  return true;
}

/** RECOVERY: Send OTP */
export async function recoverySendOtp(phone: string) {
  // ✅ ប្ដូរ route ឱ្យ match backend អ្នក
  await api.post("/auth/recovery/send-otp", { phone, channel: "telegram" });
}

/** RECOVERY: Verify OTP -> returns recoveryToken */
export async function recoveryVerifyOtp(phone: string, otp: string): Promise<string> {
  // ✅ ប្ដូរ route ឱ្យ match backend អ្នក
  const res = await api.post("/auth/recovery/verify-otp", { phone, otp });
  const recoveryToken = res.data?.recoveryToken;
  if (!recoveryToken) throw new Error("Missing recoveryToken");
  return recoveryToken;
}

/** RECOVERY: Reset PIN -> returns access/refresh token */
export async function recoveryResetPin(recoveryToken: string, newPin: string) {
  // ✅ ប្ដូរ route ឱ្យ match backend អ្នក
  const res = await api.post("/auth/recovery/reset-pin", { recoveryToken, newPin });

  const { accessToken, refreshToken } = res.data ?? {};
  if (!accessToken || !refreshToken) throw new Error("Missing tokens from backend");
  await saveTokens(accessToken, refreshToken);
}
