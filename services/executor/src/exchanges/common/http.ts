import crypto from "node:crypto";

export type HttpMethod = "GET" | "POST" | "DELETE";

export function hmacSha256Hex(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function hmacSha256Base64(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64");
}

export function toQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

export async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }
}

