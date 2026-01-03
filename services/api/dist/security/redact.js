const SENSITIVE_KEYS = new Set([
    "apiKey",
    "api_key",
    "secret",
    "apiSecret",
    "passphrase",
    "privateKey",
    "KEY_VAULT_MASTER_KEY_B64"
]);
export function redactObject(value) {
    if (value === null || value === undefined)
        return value;
    if (Array.isArray(value))
        return value.map(redactObject);
    if (typeof value !== "object")
        return value;
    const obj = value;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(k))
            out[k] = "[REDACTED]";
        else
            out[k] = redactObject(v);
    }
    return out;
}
export function maskApiKeyHint(apiKey) {
    const trimmed = apiKey.trim();
    const last4 = trimmed.slice(-4);
    return `****${last4}`;
}
