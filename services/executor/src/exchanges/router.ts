import type { ExchangeKeyPayload } from "../security/keyVault.js";
import { BybitClient } from "./bybit/client.js";
import { BitgetClient } from "./bitget/client.js";

export type SupportedExchange = "bybit" | "bitget";

export function assertSupportedExchange(x: string): asserts x is SupportedExchange {
  if (x !== "bybit" && x !== "bitget") throw new Error("unsupported_exchange");
}

export function makeExchangeClient(exchange: SupportedExchange, payload: ExchangeKeyPayload) {
  if (exchange === "bybit") {
    return new BybitClient({ apiKey: payload.apiKey, apiSecret: payload.apiSecret }, (process.env.BYBIT_ENV as any) ?? "mainnet");
  }
  if (!payload.passphrase) throw new Error("bitget_passphrase_required");
  return new BitgetClient(
    { apiKey: payload.apiKey, apiSecret: payload.apiSecret, passphrase: payload.passphrase },
    (process.env.BITGET_ENV as any) ?? "mainnet"
  );
}

