import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ExpenseResponse } from "@expense/shared";

export interface DailyStats {
  date: string;
  total: string;
  count: number;
}

export interface WeeklyStats {
  weekStart: string;
  days: DailyStats[];
  total: string;
  count: number;
}

export interface MonthlyStats {
  month: string;
  days: DailyStats[];
  total: string;
  avgPerDay: string;
  count: number;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  total: string;
  count: number;
  percentage: number;
}

export interface PaginatedExpenses {
  items: ExpenseResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useDailyStats(date: string) {
  return useQuery<DailyStats>({
    queryKey: ["dailyStats", date],
    queryFn: async () => {
      return apiFetch(`/expenses/stats/daily?date=${encodeURIComponent(date)}`);
    },
    enabled: !!date,
  });
}

export function useWeeklyStats(weekStart: string) {
  return useQuery<WeeklyStats>({
    queryKey: ["weeklyStats", weekStart],
    queryFn: async () => {
      return apiFetch(
        `/expenses/stats/weekly?weekStart=${encodeURIComponent(weekStart)}`
      );
    },
    enabled: !!weekStart,
  });
}

export function useMonthlyStats(year: number, month: number) {
  return useQuery<MonthlyStats>({
    queryKey: ["monthlyStats", year, month],
    queryFn: async () => {
      return apiFetch(
        `/expenses/stats/monthly?year=${year}&month=${month}`
      );
    },
    enabled: year > 0 && month > 0,
  });
}

export function useCategoryBreakdown(from: string, to: string) {
  return useQuery<CategoryBreakdown[]>({
    queryKey: ["categoryBreakdown", from, to],
    queryFn: async () => {
      return apiFetch(
        `/expenses/stats/categories?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
    },
    enabled: !!from && !!to,
  });
}

export function useRecentExpenses(limit = 5) {
  return useQuery<PaginatedExpenses>({
    queryKey: ["recentExpenses", limit],
    queryFn: async () => {
      return apiFetch(`/expenses?limit=${limit}&sort=date_desc`);
    },
  });
}
