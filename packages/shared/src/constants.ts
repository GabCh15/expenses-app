export const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#10b981", icon: "🍔" },
  { name: "Transport", color: "#f59e0b", icon: "🚗" },
  { name: "Entertainment", color: "#8b5cf6", icon: "🎮" },
  { name: "Utilities", color: "#0ea5e9", icon: "💡" },
  { name: "Health", color: "#f43f5e", icon: "🏥" },
  { name: "Shopping", color: "#6366f1", icon: "🛒" },
  { name: "Housing", color: "#f97316", icon: "🏠" },
  { name: "Income", color: "#14b8a6", icon: "💰" },
  { name: "Other", color: "#64748b", icon: "📦" },
] as const;

export const SUPPORTED_CURRENCIES = ["USD", "COP", "EUR"] as const;
export const CURRENCY_DEFAULT = "USD";
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const TOKEN_EXPIRY = {
  access: 900, // 15 minutes
  refresh: 604800, // 7 days
} as const;
