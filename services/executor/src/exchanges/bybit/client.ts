import { fetchJson, hmacSha256Hex, toQueryString, type HttpMethod } from "../common/http.js";

export type BybitEnv = "mainnet" | "testnet";

export type BybitCredentials = {
  apiKey: string;
  apiSecret: string;
};

export type BybitV5Response<T> = {
  retCode: number;
  retMsg: string;
  result: T;
  time: number;
};

export class BybitClient {
  private baseUrl: string;
  private recvWindow: string;

  constructor(private creds: BybitCredentials, env: BybitEnv = "mainnet", recvWindowMs = 5000) {
    this.baseUrl = env === "testnet" ? "https://api-testnet.bybit.com" : "https://api.bybit.com";
    this.recvWindow = String(recvWindowMs);
  }

  private sign(ts: string, queryOrBody: string): string {
    // Bybit v5: signature = HMAC_SHA256(secret, timestamp + apiKey + recvWindow + queryString/body)
    return hmacSha256Hex(this.creds.apiSecret, `${ts}${this.creds.apiKey}${this.recvWindow}${queryOrBody}`);
  }

  private async request<T>(method: HttpMethod, path: string, params?: Record<string, any>): Promise<T> {
    const ts = String(Date.now());
    const isGet = method === "GET";
    const query = isGet ? toQueryString(params ?? {}) : "";
    const body = !isGet ? JSON.stringify(params ?? {}) : "";
    const signPayload = isGet ? query : body;

    const headers: Record<string, string> = {
      "X-BAPI-API-KEY": this.creds.apiKey,
      "X-BAPI-TIMESTAMP": ts,
      "X-BAPI-RECV-WINDOW": this.recvWindow,
      "X-BAPI-SIGN": this.sign(ts, signPayload),
      "content-type": "application/json"
    };

    const url = `${this.baseUrl}${path}${query ? `?${query}` : ""}`;
    const json = await fetchJson<BybitV5Response<T>>(url, { method, headers, body: body || undefined });
    if (json.retCode !== 0) throw new Error(`Bybit error ${json.retCode}: ${json.retMsg}`);
    return json.result;
  }

  // --- Safety checks ---
  async getApiKeyInfo(): Promise<any> {
    // Bybit v5 endpoint (user data): /v5/user/query-api
    // Used to confirm trading/read permissions and to ensure withdrawal permission is NOT enabled.
    return await this.request("GET", "/v5/user/query-api", {});
  }

  // --- Futures (linear) ---
  async getWalletBalance(coin = "USDT"): Promise<any> {
    return await this.request("GET", "/v5/account/wallet-balance", { accountType: "UNIFIED", coin });
  }

  async getPositions(symbol?: string): Promise<any> {
    return await this.request("GET", "/v5/position/list", { category: "linear", symbol });
  }

  async placeOrder(params: {
    symbol: string;
    side: "Buy" | "Sell";
    orderType: "Market" | "Limit";
    qty: string;
    price?: string;
    timeInForce?: "GTC" | "IOC" | "FOK";
    reduceOnly?: boolean;
    clientOrderId?: string;
  }): Promise<any> {
    return await this.request("POST", "/v5/order/create", { category: "linear", ...params });
  }

  async cancelOrder(params: { symbol: string; orderId?: string; clientOrderId?: string }): Promise<any> {
    return await this.request("POST", "/v5/order/cancel", { category: "linear", ...params });
  }
}

