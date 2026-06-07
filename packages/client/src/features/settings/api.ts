import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { CategoryResponse } from "@expense/shared";

export function useCategories() {
  return useQuery<CategoryResponse[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      return apiFetch("/categories");
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; color?: string; icon?: string }) => {
      return apiFetch<CategoryResponse>("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string; icon?: string } }) => {
      return apiFetch<CategoryResponse>(`/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<{ deleted: true }>(`/categories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useRestoreCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<CategoryResponse>(`/categories/${id}/restore`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  telegramLinked: boolean;
  currency: string;
  createdAt: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { displayName?: string; currency?: string }) => {
      return apiFetch<UserProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.setQueryData(["currentUser"], data);
    },
  });
}

export function useLinkTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      return apiFetch<{ linked: true; displayName: string }>("/users/link-telegram", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}
