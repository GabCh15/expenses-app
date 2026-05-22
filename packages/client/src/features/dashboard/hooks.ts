import { useAuthStore } from "@/stores/auth";

export function useUserCurrency(): string {
  return useAuthStore((s) => s.user?.currency) ?? "USD";
}
