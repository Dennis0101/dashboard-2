import { fetchJson, hmacSha256Hex, toQueryString } from "../common/http.js";
export class BybitClient {
    creds;
    baseUrl;
    recvWindow;
    constructor(creds, env = "mainnet", recvWindowMs = 5000) {
        this.creds = creds;
        this.baseUrl = env === "testnet" ? "https://api-testnet.bybit.com" : "https://api.bybit.com";
        this.recvWindow = String(recvWindowMs);
    }
    sign(ts, queryOrBody) {
        // Bybit v5: signature = HMAC_SHA256(secret, timestamp + apiKey + recvWindow + queryString/body)
        return hmacSha256Hex(this.creds.apiSecret, `${ts}${this.creds.apiKey}${this.recvWindow}${queryOrBody}`);
    }
    async request(method, path, params) {
        const ts = String(Date.now());
        const isGet = method === "GET";
        const query = isGet ? toQueryString(params ?? {}) : "";
        const body = !isGet ? JSON.stringify(params ?? {}) : "";
        const signPayload = isGet ? query : body;
        const headers = {
            "X-BAPI-API-KEY": this.creds.apiKey,
            "X-BAPI-TIMESTAMP": ts,
            "X-BAPI-RECV-WINDOW": this.recvWindow,
            "X-BAPI-SIGN": this.sign(ts, signPayload),
            "content-type": "application/json"
        };
        const url = `${this.baseUrl}${path}${query ? `?${query}` : ""}`;
        const json = await fetchJson(url, { method, headers, body: body || undefined });
        if (json.retCode !== 0)
            throw new Error(`Bybit error ${json.retCode}: ${json.retMsg}`);
        return json.result;
    }
    // --- Safety checks ---
    async getApiKeyInfo() {
        // Bybit v5 endpoint (user data): /v5/user/query-api
        // Used to confirm trading/read permissions and to ensure withdrawal permission is NOT enabled.
        return await this.request("GET", "/v5/user/query-api", {});
    }
    async verifySafety() {
        const info = await this.getApiKeyInfo();
        const { requireExplicitWithdrawalDisabled, findBooleanFlags } = await import("../common/permissions.js");
        // Withdrawal must be explicitly disabled.
        const wd = requireExplicitWithdrawalDisabled(info);
        if (!wd.ok)
            return wd;
        // Also ensure API key is not read-only (must be able to trade).
        const ro = findBooleanFlags(info, ["readOnly", "readonly", "isReadOnly"]);
        if (ro.trues.length > 0)
            return { ok: false, reason: "api_key_read_only" };
        return { ok: true };
    }
    // --- Futures (linear) ---
    async getWalletBalance(coin = "USDT") {
        return await this.request("GET", "/v5/account/wallet-balance", { accountType: "UNIFIED", coin });
    }
    async getPositions(symbol) {
        return await this.request("GET", "/v5/position/list", { category: "linear", symbol });
    }
    async placeOrder(params) {
        return await this.request("POST", "/v5/order/create", { category: "linear", ...params });
    }
    async cancelOrder(params) {
        return await this.request("POST", "/v5/order/cancel", { category: "linear", ...params });
    }
}
