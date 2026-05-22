/// <reference types="vite/client" />
import { useAuthStore } from "@/stores/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => refreshQueue.push(resolve));
  }

  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Refresh failed");
    }

    const data = await res.json();
    useAuthStore.getState().setAuth(data.accessToken, useAuthStore.getState().user);
    return data.accessToken;
  } catch {
    useAuthStore.getState().logout();
    return null;
  } finally {
    isRefreshing = false;
    refreshQueue.forEach((cb) => cb(useAuthStore.getState().accessToken));
    refreshQueue = [];
  }
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth, ...rest } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(rest.headers);
  headers.set("Content-Type", "application/json");

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      const retryResponse = await fetch(url, {
        ...rest,
        headers,
        credentials: "include",
      });
      if (!retryResponse.ok) {
        const err = await retryResponse.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${retryResponse.status}`);
      }
      return retryResponse.json();
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  return response.json();
}
