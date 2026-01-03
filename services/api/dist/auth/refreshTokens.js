import crypto from "node:crypto";
function sha256(input) {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}
export function hashRefreshToken(token, pepper) {
    // Store only a hash; raw token never persisted.
    return sha256(`${pepper}:${token}`);
}
export function generateRefreshToken() {
    // 32 bytes -> url-safe base64
    return crypto.randomBytes(32).toString("base64url");
}
export async function insertRefreshToken(params) {
    const { tx, userId, tokenHash, deviceId, expiresAt } = params;
    const rows = await tx `
    insert into refresh_tokens (user_id, token_hash, device_id, expires_at)
    values (${userId}::uuid, ${tokenHash}, ${deviceId ?? null}, ${expiresAt.toISOString()})
    returning id
  `;
    return rows[0];
}
export async function revokeRefreshToken(params) {
    const { tx, tokenHash } = params;
    await tx `update refresh_tokens set revoked_at = now() where token_hash = ${tokenHash} and revoked_at is null`;
}
export async function rotateRefreshToken(params) {
    const { tx, userId, oldTokenHash, newTokenHash, deviceId, expiresAt } = params;
    const inserted = await insertRefreshToken({ tx, userId, tokenHash: newTokenHash, deviceId, expiresAt });
    await tx `
    update refresh_tokens
    set revoked_at = now(), replaced_by = ${inserted.id}::uuid
    where user_id = ${userId}::uuid and token_hash = ${oldTokenHash} and revoked_at is null
  `;
}
