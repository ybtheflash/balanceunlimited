/**
 * Generate a unique 10-character alphanumeric App ID.
 * Format: uppercase letters + digits, e.g. "A3K9X2M7P1"
 * This is permanent and never changeable.
 */
export function generateAppUniqueId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique KC charge ID for spend transactions.
 * Format: first 6 of userId + timestamp in base36 + amount
 * Example: "A3K9X2-lkqz8w3-500"
 */
export function generateChargeId(userId: string, amount: number): string {
  const prefix = userId.slice(0, 6).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `${prefix}-${ts}-${amount}`;
}

/**
 * Generate a unique payment ID for top-up transactions (mock).
 * Format: "PAY-" + timestamp hex + random 4 chars
 * Example: "PAY-18F3A2B1-K9X2"
 */
export function generatePaymentId(): string {
  const tsHex = Date.now().toString(16).toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PAY-${tsHex}-${rand}`;
}
