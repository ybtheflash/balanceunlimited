export function getTierFromSpent(spent: number): string {
  if (spent >= 100000) return "Giga-rich";
  if (spent >= 50000) return "Whale";
  if (spent >= 10000) return "Count de Monet";
  if (spent >= 1000) return "Trust-Funder";
  return "YaBasic";
}
