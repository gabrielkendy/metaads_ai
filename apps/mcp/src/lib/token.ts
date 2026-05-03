import crypto from "node:crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const KEY = (() => {
  const k = env.SUPABASE_ENCRYPTION_KEY ?? "default-encryption-key-please-change-32";
  // Pad/trim para 32 bytes
  return crypto.scryptSync(k, "base-trafego-salt", 32);
})();

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptToken(encrypted: string): string {
  const data = Buffer.from(encrypted, "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const cipherText = data.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
  return decrypted.toString("utf8");
}
