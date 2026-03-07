"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { ThemeMode, useThemeMode } from "./ThemeProvider";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme } = useThemeMode();

  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      try {
        const meResponse = await api.get("/auth/me");
        if (!meResponse.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const mePayload = (await meResponse.json()) as User;
        if (!cancelled) setUser(mePayload);

        const profileResponse = await api.get("/user/profile");
        if (!profileResponse.ok) return;
        const profile = (await profileResponse.json()) as {
          preferences?: { theme?: ThemeMode };
        };
        const savedTheme = profile.preferences?.theme;
        if (
          !cancelled &&
          (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")
        ) {
          setTheme(savedTheme);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  const logout = useCallback(async () => {
    await Promise.all([
      api.post("/auth/logout", {}),
      fetch("/api/auth/logout", { method: "POST" }),
    ]);
    setUser(null);
    window.location.href = "/auth/signin";
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
