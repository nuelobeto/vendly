import { createHash, randomBytes } from "node:crypto"

/**
 * Invite tokens. The raw token goes in the link; only its hash is stored, so a
 * leaked database backup can't be used to accept outstanding invites.
 *
 * Hashing is plain SHA-256 rather than a password KDF on purpose: the token is
 * 256 bits of CSPRNG output, so there is nothing to brute-force and the extra
 * cost would buy nothing.
 *
 * Server-only — `node:crypto` must never reach the browser bundle.
 */
export function generateInviteToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, tokenHash: hashInviteToken(token) }
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
