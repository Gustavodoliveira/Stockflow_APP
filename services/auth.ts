// Função para decodificar e checar expiração do token JWT
export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (!decoded.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
}
import * as SecureStore from "expo-secure-store";
import { UserResponse } from "./UserApi";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export async function saveAuth(token: string, user: UserResponse): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getUser(): Promise<UserResponse | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as UserResponse) : null;
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
