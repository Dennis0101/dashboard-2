import { fetchJson, hmacSha256Base64, toQueryString } from "../common/http.js";
export class BitgetClient {
    creds;
    baseUrl;
    constructor(creds, env = "mainnet") {
        this.creds = creds;
        // Bitget has multiple domains; this is the common API base for v2.
        this.baseUrl = env === "testnet" ? "https://api.bitget.com" : "https://api.bitget.com";
    }
    sign(tsMs, method, requestPath, query, body) {
        // Bitget signature pattern (common):
        // sign = base64(HMAC_SHA256(secret, timestamp + method + requestPath + queryString + body))
        const q = query ? `?${query}` : "";
        const prehash = `${tsMs}${method}${requestPath}${q}${body}`;
        return hmacSha256Base64(this.creds.apiSecret, prehash);
    }
    async request(method, requestPath, params) {
        const ts = String(Date.now());
        const isGet = method === "GET";
        const query = isGet ? toQueryString(params ?? {}) : "";
        const body = !isGet ? JSON.stringify(params ?? {}) : "";
        const headers = {
            "ACCESS-KEY": this.creds.apiKey,
            "ACCESS-SIGN": this.sign(ts, method, requestPath, query, body),
            "ACCESS-TIMESTAMP": ts,
            "ACCESS-PASSPHRASE": this.creds.passphrase,
            "content-type": "application/json"
        };
        const url = `${this.baseUrl}${requestPath}${query ? `?${query}` : ""}`;
        const json = await fetchJson(url, { method, headers, body: body || undefined });
        // Bitget common response: { code: "00000", msg: "success", data: ... }
        const code = String(json.code ?? "");
        if (code !== "00000")
            throw new Error(`Bitget error ${code}: ${String(json.msg ?? "")}`);
        return json.data;
    }
    // --- Safety checks ---
    async getApiKeyInfo() {
        // Bitget endpoint can vary by API version. We try common candidates.
        const candidates = [
            "/api/v2/spot/account/getApiKeyInfo",
            "/api/spot/v1/account/getApikeyInfo",
            "/api/v2/user/query-api" // some deployments mirror naming; safe fallback
        ];
        let lastErr = null;
        for (const path of candidates) {
            try {
                // signed GET; no params
                return await this.request("GET", path, {});
            }
            catch (e) {
                lastErr = e;
            }
        }
        throw lastErr instanceof Error ? lastErr : new Error("bitget_api_key_permission_check_failed");
    }
    async verifySafety() {
        const info = await this.getApiKeyInfo();
        const { requireExplicitWithdrawalDisabled } = await import("../common/permissions.js");
        const wd = requireExplicitWithdrawalDisabled(info);
        if (!wd.ok)
            return wd;
        return { ok: true };
    }
    // --- Futures (USDT-M) ---
    async getAccountOverview(productType = "USDT-FUTURES") {
        return await this.request("GET", "/api/v2/mix/account/account", { productType });
    }
    async getPositions(productType = "USDT-FUTURES") {
        return await this.request("GET", "/api/v2/mix/position/all-position", { productType });
    }
    async placeOrder(params) {
        return await this.request("POST", "/api/v2/mix/order/place-order", params);
    }
    async cancelOrder(params) {
        return await this.request("POST", "/api/v2/mix/order/cancel-order", params);
    }
}
