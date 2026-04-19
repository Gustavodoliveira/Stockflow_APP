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
