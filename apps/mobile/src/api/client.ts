import { getSessionToken } from "../state/session";

export type ApiConfig = {
  baseUrl: string;
};

export const apiConfig: ApiConfig = {
  // In production, set via app config / EAS updates.
  baseUrl: "http://localhost:8080"
};

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(await authHeaders())
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiConfig.baseUrl}${path}`, {
    method: "GET",
    headers: {
      ...(await authHeaders())
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

