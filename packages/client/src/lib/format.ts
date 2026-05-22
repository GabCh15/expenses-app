const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  COP: "$",
  EUR: "€",
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? "$";
}

export function formatAmount(
  amount: string | number,
  _currency: string
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatCurrency(
  amount: string | number,
  currency: string
): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${formatAmount(amount, currency)}`;
}
