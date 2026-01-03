import crypto from "node:crypto";
function bytesToUuidV4(bytes) {
    const b = Buffer.from(bytes.subarray(0, 16));
    // version 4
    b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
    // variant
    b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
    const hex = b.toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function parseDevSessionToken(token) {
    // format: dev-session:<provider>:<subject>
    const parts = token.split(":");
    if (parts.length < 3)
        return null;
    if (parts[0] !== "dev-session")
        return null;
    const provider = parts[1] ?? "";
    const subject = parts.slice(2).join(":");
    if (!provider || !subject)
        return null;
    const digest = crypto.createHash("sha256").update(`${provider}:${subject}`, "utf8").digest();
    const userId = bytesToUuidV4(digest);
    return { provider, subject, userId };
}
