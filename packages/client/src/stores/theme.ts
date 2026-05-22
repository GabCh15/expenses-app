import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: "light",
      setTheme: (theme) => {
        const resolved = getResolvedTheme(theme);
        applyTheme(resolved);
        set({ theme, resolvedTheme: resolved });
      },
      toggleTheme: () => {
        const current = get().resolvedTheme;
        const next = current === "light" ? "dark" : "light";
        applyTheme(next);
        set({ theme: next, resolvedTheme: next });
      },
    }),
    {
      name: "gasto-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = getResolvedTheme(state.theme);
          applyTheme(resolved);
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);
