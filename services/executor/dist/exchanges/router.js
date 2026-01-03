import { BybitClient } from "./bybit/client.js";
import { BitgetClient } from "./bitget/client.js";
export function assertSupportedExchange(x) {
    if (x !== "bybit" && x !== "bitget")
        throw new Error("unsupported_exchange");
}
export function makeExchangeClient(exchange, payload) {
    if (exchange === "bybit") {
        return new BybitClient({ apiKey: payload.apiKey, apiSecret: payload.apiSecret }, process.env.BYBIT_ENV ?? "mainnet");
    }
    if (!payload.passphrase)
        throw new Error("bitget_passphrase_required");
    return new BitgetClient({ apiKey: payload.apiKey, apiSecret: payload.apiSecret, passphrase: payload.passphrase }, process.env.BITGET_ENV ?? "mainnet");
}
