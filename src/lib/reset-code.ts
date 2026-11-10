import crypto from "crypto";

function secret() {
  const value = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET (or AUTH_SECRET) must be set");
  return value;
}

/** Keyed hash so a leaked database can't be used to recover 6-digit codes. */
export function hashResetCode(email: string, code: string) {
  return crypto.createHmac("sha256", secret()).update(`${email}:${code}`).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
