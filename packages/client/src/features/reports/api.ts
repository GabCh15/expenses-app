import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { DailyStats, CategoryBreakdown } from "@/features/dashboard/api";

export interface ReportSummary {
  daily: DailyStats[];
  categories: CategoryBreakdown[];
  total: number;
  count: number;
  avgPerDay: number;
  topCategory: CategoryBreakdown | null;
}

export function useReportSummary(from: string, to: string) {
  return useQuery<ReportSummary>({
    queryKey: ["reportSummary", from, to],
    queryFn: async () => {
      const [dailyRes, categoriesRes] = await Promise.all([
        apiFetch<DailyStats[]>(`/expenses/stats/daily?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        apiFetch<CategoryBreakdown[]>(`/expenses/stats/categories?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
      ]);

      // Note: The server stats endpoints may not support arbitrary date ranges.
      // If they don't, we fall back to empty arrays.
      const daily = Array.isArray(dailyRes) ? dailyRes : [];
      const categories = Array.isArray(categoriesRes) ? categoriesRes : [];

      const total = categories.reduce((sum, c) => sum + parseFloat(c.total || "0"), 0);
      const count = categories.reduce((sum, c) => sum + (c.count || 0), 0);
      const avgPerDay = daily.length > 0 ? total / daily.length : 0;
      const topCategory = categories.length > 0
        ? categories.reduce((max, c) => (parseFloat(c.total) > parseFloat(max.total) ? c : max), categories[0])
        : null;

      return {
        daily,
        categories,
        total,
        count,
        avgPerDay,
        topCategory,
      };
    },
    enabled: !!from && !!to,
  });
}

export function useExportCSV(from: string, to: string) {
  return useQuery({
    queryKey: ["exportCSV", from, to],
    queryFn: async () => {
      // Fetch all expenses in the date range (max 1000)
      const data = await apiFetch<{
        items: Array<{
          expenseDate: string;
          category: { name: string } | null;
          description: string | null;
          amount: string;
          currency: string;
        }>;
      }>(`/expenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=1000&sort=date_asc`);

      const items = data.items || [];
      const headers = ["Date", "Category", "Description", "Amount", "Currency"];
      const rows = items.map((item) => [
        new Date(item.expenseDate).toISOString().split("T")[0],
        item.category?.name || "Uncategorized",
        item.description || "",
        item.amount,
        item.currency,
      ]);

      const csv = [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell);
              if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(",")
        )
        .join("\n");

      return csv;
    },
    enabled: false, // Manual trigger
    staleTime: Infinity,
  });
}
