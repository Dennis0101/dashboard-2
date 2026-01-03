import { fetchJson, hmacSha256Base64, toQueryString, type HttpMethod } from "../common/http.js";

export type BitgetEnv = "mainnet" | "testnet";

export type BitgetCredentials = {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
};

export class BitgetClient {
  private baseUrl: string;

  constructor(private creds: BitgetCredentials, env: BitgetEnv = "mainnet") {
    // Bitget has multiple domains; this is the common API base for v2.
    this.baseUrl = env === "testnet" ? "https://api.bitget.com" : "https://api.bitget.com";
  }

  private sign(tsMs: string, method: HttpMethod, requestPath: string, query: string, body: string): string {
    // Bitget signature pattern (common):
    // sign = base64(HMAC_SHA256(secret, timestamp + method + requestPath + queryString + body))
    const q = query ? `?${query}` : "";
    const prehash = `${tsMs}${method}${requestPath}${q}${body}`;
    return hmacSha256Base64(this.creds.apiSecret, prehash);
  }

  private async request<T>(method: HttpMethod, requestPath: string, params?: Record<string, any>): Promise<T> {
    const ts = String(Date.now());
    const isGet = method === "GET";
    const query = isGet ? toQueryString(params ?? {}) : "";
    const body = !isGet ? JSON.stringify(params ?? {}) : "";

    const headers: Record<string, string> = {
      "ACCESS-KEY": this.creds.apiKey,
      "ACCESS-SIGN": this.sign(ts, method, requestPath, query, body),
      "ACCESS-TIMESTAMP": ts,
      "ACCESS-PASSPHRASE": this.creds.passphrase,
      "content-type": "application/json"
    };

    const url = `${this.baseUrl}${requestPath}${query ? `?${query}` : ""}`;
    const json = await fetchJson<any>(url, { method, headers, body: body || undefined });

    // Bitget common response: { code: "00000", msg: "success", data: ... }
    const code = String(json.code ?? "");
    if (code !== "00000") throw new Error(`Bitget error ${code}: ${String(json.msg ?? "")}`);
    return json.data as T;
  }

  // --- Safety checks ---
  async getApiKeyInfo(): Promise<any> {
    // Bitget endpoint can vary by API version. We try common candidates.
    const candidates = [
      "/api/v2/spot/account/getApiKeyInfo",
      "/api/spot/v1/account/getApikeyInfo",
      "/api/v2/user/query-api" // some deployments mirror naming; safe fallback
    ];

    let lastErr: unknown = null;
    for (const path of candidates) {
      try {
        // signed GET; no params
        return await this.request("GET", path, {});
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("bitget_api_key_permission_check_failed");
  }

  async verifySafety(): Promise<{ ok: true } | { ok: false; reason: string; detail?: string }> {
    const info = await this.getApiKeyInfo();
    const { requireExplicitWithdrawalDisabled } = await import("../common/permissions.js");
    const wd = requireExplicitWithdrawalDisabled(info);
    if (!wd.ok) return wd;
    return { ok: true };
  }

  // --- Futures (USDT-M) ---
  async getAccountOverview(productType: "USDT-FUTURES" | "COIN-FUTURES" = "USDT-FUTURES"): Promise<any> {
    return await this.request("GET", "/api/v2/mix/account/account", { productType });
  }

  async getPositions(productType: "USDT-FUTURES" | "COIN-FUTURES" = "USDT-FUTURES"): Promise<any> {
    return await this.request("GET", "/api/v2/mix/position/all-position", { productType });
  }

  async placeOrder(params: {
    symbol: string;
    productType: "USDT-FUTURES";
    marginMode: "isolated" | "crossed";
    marginCoin: "USDT";
    size: string;
    side: "buy" | "sell";
    tradeSide?: "open" | "close";
    orderType: "market" | "limit";
    price?: string;
    clientOid?: string;
    reduceOnly?: "YES" | "NO";
  }): Promise<any> {
    return await this.request("POST", "/api/v2/mix/order/place-order", params);
  }

  async cancelOrder(params: {
    symbol: string;
    productType: "USDT-FUTURES";
    orderId?: string;
    clientOid?: string;
  }): Promise<any> {
    return await this.request("POST", "/api/v2/mix/order/cancel-order", params);
  }
}

