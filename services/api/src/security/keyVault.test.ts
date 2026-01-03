import { describe, expect, it } from "vitest";
import { decryptExchangeKeyPayload, encryptExchangeKeyPayload } from "./keyVault.js";

describe("keyVault", () => {
  it("encrypt/decrypt roundtrip", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const enc = encryptExchangeKeyPayload({ apiKey: "k", apiSecret: "s", passphrase: "p" }, key);
    const dec = decryptExchangeKeyPayload(enc, key);
    expect(dec).toEqual({ apiKey: "k", apiSecret: "s", passphrase: "p" });
  });

  it("rejects wrong master key", () => {
    const key1 = Buffer.alloc(32, 1).toString("base64");
    const key2 = Buffer.alloc(32, 2).toString("base64");
    const enc = encryptExchangeKeyPayload({ apiKey: "k", apiSecret: "s" }, key1);
    expect(() => decryptExchangeKeyPayload(enc, key2)).toThrow();
  });
});

