import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "session_token_v1";

export async function getSessionToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

