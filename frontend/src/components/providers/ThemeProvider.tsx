"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = "thetutor-theme";

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : "light";
  });
  const pathname = usePathname();

  const isThemeEnabledRoute = useMemo(() => {
    const current = pathname ?? "/";
    const themedPrefixes = ["/dashboard", "/explore", "/learn", "/profile", "/settings", "/create-course"];
    return themedPrefixes.some(
      (prefix) => current === prefix || current.startsWith(`${prefix}/`)
    );
  }, [pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = isThemeEnabledRoute ? theme : "light";
  }, [isThemeEnabledRoute, theme]);

  const setTheme = (nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      // Disable all transitions while swapping theme to prevent twitch/flash
      document.documentElement.classList.add("no-transitions");
      document.documentElement.dataset.theme = nextTheme;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("no-transitions");
        });
      });
    }
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
