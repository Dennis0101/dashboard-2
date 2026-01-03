import { z } from "zod";
const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(8080),
    DATABASE_URL: z.string().min(1).optional(),
    // 32-byte key, base64 encoded (AES-256-GCM)
    KEY_VAULT_MASTER_KEY_B64: z.string().min(1).optional(),
    // In production, prefer verifying Apple/Google ID tokens. Stubbed for now.
    AUTH_ACCEPT_UNSIGNED_DEV_TOKENS: z.coerce.boolean().default(true)
});
export function loadConfig(env) {
    return EnvSchema.parse(env);
}
