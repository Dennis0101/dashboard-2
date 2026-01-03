import crypto from "node:crypto";
export function hmacSha256Hex(secret, payload) {
    return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}
export function hmacSha256Base64(secret, payload) {
    return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64");
}
export function toQueryString(params) {
    const entries = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}
export async function fetchJson(url, init) {
    const res = await fetch(url, init);
    const text = await res.text();
    if (!res.ok)
        throw new Error(`HTTP ${res.status}: ${text}`);
    try {
        return JSON.parse(text);
    }
    catch {
        throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
    }
}
