// @ts-ignore
import * as OTPAuth from "otpauth";

/**
 * ZestyAuth — TOTP-based 2FA for Balance Unlimited.
 * Uses standard TOTP (RFC 6238) compatible with Google Authenticator,
 * Authy, Microsoft Authenticator, and any TOTP app.
 */

/**
 * Helper to create a TOTP instance from a secret and optional email
 */
function getTOTPInstance(secret: string, email?: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: "Balance Unlimited (ZestyAuth)",
    label: email || "User",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/**
 * Generate a new TOTP secret for a user.
 */
export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Generate the otpauth:// URI for scanning with an authenticator app.
 * This URI can be encoded as a QR code.
 */
export function getTotpUri(secret: string, email: string): string {
  const totp = getTOTPInstance(secret, email);
  return totp.toString();
}

/**
 * Verify a TOTP token against a secret.
 * Allows ±1 time step window for clock drift tolerance.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    const totp = getTOTPInstance(secret);
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

/**
 * Generate the current valid TOTP token for a secret.
 * (Used for testing/verification during setup)
 */
export function generateCurrentToken(secret: string): string {
  const totp = getTOTPInstance(secret);
  return totp.generate();
}

/**
 * Format a secret for manual entry display.
 * Groups into 4-character blocks for readability.
 * Example: "JBSW Y3DP EHPK 3PXP"
 */
export function formatSecretForDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
}
