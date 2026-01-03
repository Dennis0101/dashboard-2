import crypto from "node:crypto";
import { z } from "zod";
const PayloadSchema = z.object({
    apiKey: z.string().min(1),
    apiSecret: z.string().min(1),
    passphrase: z.string().optional()
});
function mustGetMasterKey(masterKeyB64) {
    if (!masterKeyB64)
        throw new Error("KEY_VAULT_MASTER_KEY_B64 is required");
    const key = Buffer.from(masterKeyB64, "base64");
    if (key.length !== 32)
        throw new Error("KEY_VAULT_MASTER_KEY_B64 must decode to 32 bytes");
    return key;
}
export function decryptExchangeKeyPayload(enc, masterKeyB64) {
    const key = mustGetMasterKey(masterKeyB64);
    if (enc.alg !== "AES-256-GCM")
        throw new Error("Unsupported encryption algorithm");
    const iv = Buffer.from(enc.ivB64, "base64");
    const tag = Buffer.from(enc.tagB64, "base64");
    const ct = Buffer.from(enc.ctB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    const obj = JSON.parse(pt.toString("utf8"));
    return PayloadSchema.parse(obj);
}
