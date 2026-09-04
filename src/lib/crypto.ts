import 'server-only'
import crypto from 'crypto'

// Symmetric encryption for secrets stored in the database (T-Bank password /
// terminal key, OpenAI key). Uses AES-256-GCM with a random 96-bit IV per value.
//
// The key comes from SETTINGS_ENCRYPTION_KEY:
//   - 64 hex chars  → used directly as the 32-byte key
//   - anything else → treated as a passphrase and hashed (SHA-256) to 32 bytes
//
// When the env var is absent, encryption is disabled and values are stored as
// plaintext (with a one-time warning). Stored values are self-describing:
// encrypted ones carry an "enc:v1:" prefix, so legacy plaintext keeps working.

const PREFIX = 'enc:v1:'
let warnedMissingKey = false

function getKey(): Buffer | null {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim()
  if (!raw) return null
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex')
  return crypto.createHash('sha256').update(raw, 'utf8').digest()
}

export function isEncryptionEnabled(): boolean {
  return getKey() !== null
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX)
}

/**
 * Encrypts a plaintext secret. If no encryption key is configured, returns the
 * plaintext unchanged so the app keeps working (with a warning).
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey()
  if (!key) {
    if (!warnedMissingKey) {
      console.warn(
        '[crypto] SETTINGS_ENCRYPTION_KEY is not set — secrets are stored as plaintext.'
      )
      warnedMissingKey = true
    }
    return plaintext
  }

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const packed = Buffer.concat([iv, tag, ciphertext]).toString('base64')
  return PREFIX + packed
}

/**
 * Decrypts a stored secret. Plaintext (unprefixed, legacy) values are returned
 * as-is. Returns null if an encrypted value cannot be decrypted (missing/wrong
 * key or tampering).
 */
export function decryptSecret(stored: string): string | null {
  if (!isEncrypted(stored)) return stored // legacy plaintext

  const key = getKey()
  if (!key) {
    console.error('[crypto] encrypted secret found but SETTINGS_ENCRYPTION_KEY is not set')
    return null
  }

  try {
    const packed = Buffer.from(stored.slice(PREFIX.length), 'base64')
    const iv = packed.subarray(0, 12)
    const tag = packed.subarray(12, 28)
    const ciphertext = packed.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return plaintext.toString('utf8')
  } catch (err) {
    console.error('[crypto] failed to decrypt secret', err)
    return null
  }
}
