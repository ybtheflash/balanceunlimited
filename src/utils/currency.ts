export type Currency = "KC";

export function formatCurrency(amount: number, _currency?: Currency): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} KC`;
}
