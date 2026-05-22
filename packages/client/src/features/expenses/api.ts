import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ExpenseResponse } from "@gasto/shared";

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  from?: string;
  to?: string;
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  search?: string;
}

export interface PaginatedExpenses {
  items: ExpenseResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useExpenses(filters: ExpenseFilters = {}) {
  const { search, ...serverFilters } = filters;
  const queryParams = new URLSearchParams();

  if (serverFilters.page) queryParams.set("page", String(serverFilters.page));
  if (serverFilters.limit) queryParams.set("limit", String(serverFilters.limit));
  if (serverFilters.categoryId) queryParams.set("categoryId", serverFilters.categoryId);
  if (serverFilters.from) queryParams.set("from", serverFilters.from);
  if (serverFilters.to) queryParams.set("to", serverFilters.to);
  if (serverFilters.sort) queryParams.set("sort", serverFilters.sort);

  const queryString = queryParams.toString();

  return useQuery<PaginatedExpenses>({
    queryKey: ["expenses", serverFilters],
    queryFn: async () => {
      return apiFetch(`/expenses?${queryString}`);
    },
    enabled: true,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: number;
      categoryId: string;
      description?: string;
      expenseDate?: string;
      currency: string;
    }) => {
      return apiFetch<ExpenseResponse>("/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dailyStats"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyStats"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStats"] });
      queryClient.invalidateQueries({ queryKey: ["categoryBreakdown"] });
      queryClient.invalidateQueries({ queryKey: ["recentExpenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        amount?: number;
        categoryId?: string;
        description?: string;
        expenseDate?: string;
      };
    }) => {
      return apiFetch<ExpenseResponse>(`/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dailyStats"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyStats"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStats"] });
      queryClient.invalidateQueries({ queryKey: ["categoryBreakdown"] });
      queryClient.invalidateQueries({ queryKey: ["recentExpenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ deleted: true }>(`/expenses/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dailyStats"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyStats"] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStats"] });
      queryClient.invalidateQueries({ queryKey: ["categoryBreakdown"] });
      queryClient.invalidateQueries({ queryKey: ["recentExpenses"] });
    },
  });
}
