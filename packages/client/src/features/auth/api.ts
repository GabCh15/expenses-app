import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useNavigate } from "react-router-dom";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });
      return res;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      navigate("/");
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        skipAuth: true,
      });
      return res;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      navigate("/");
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    logout();
    queryClient.clear();
    navigate("/login");
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      return apiFetch<{
        id: string;
        email: string;
        displayName: string;
        currency: string;
      }>("/users/me");
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
}
