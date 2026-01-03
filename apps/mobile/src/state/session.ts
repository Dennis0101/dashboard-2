import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "session_token_v1";
const REFRESH_TOKEN_KEY = "refresh_token_v1";

export async function getSessionToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

