"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoonStar, Sun, UserCircle2, Bell, Shield } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useThemeMode } from "@/components/providers/ThemeProvider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ProfilePayload {
  name: string;
  email: string;
  image?: string;
  preferences?: {
    theme?: "light" | "dark";
  };
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useThemeMode();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        if (!response.ok) return;
        const payload = (await response.json()) as ProfilePayload;
        if (!cancelled) {
          setProfile(payload);
          const savedTheme = payload.preferences?.theme;
          if (savedTheme === "dark" || savedTheme === "light") {
            setTheme(savedTheme);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  const handleThemeToggle = async () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    setSavingTheme(true);
    try {
      await api.patch("/user/preferences", { theme: nextTheme });
    } finally {
      setSavingTheme(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your profile and settings.
          </p>
          <Button asChild className="skeuo-gold mt-4 rounded-full hover:!opacity-100">
            <Link href="/auth/signin">Go to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.section
          className="neo-surface rounded-3xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {profile?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt={profile?.name || "Profile"}
                className="h-16 w-16 rounded-full border border-primary/30 object-cover"
              />
            ) : (
              <div className="skeuo-gold flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold">
                {profile?.name?.[0] ?? user?.name?.[0] ?? "U"}
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-primary/80">Profile</p>
              <h1 className="text-2xl font-bold text-foreground">
                {profile?.name ?? user?.name ?? "Learner"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {profile?.email ?? user?.email ?? ""}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="neo-surface rounded-3xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">
                Toggle your dashboard between light and dark mode.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleThemeToggle}
              className="skeuo-outline rounded-full border border-border/70 text-foreground hover:border-primary/40"
              disabled={savingTheme}
            >
              {theme === "light" ? <MoonStar className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              {theme === "light" ? "Switch to Dark" : "Switch to Light"}
            </Button>
          </div>
        </motion.section>

        <motion.section
          className="neo-surface rounded-3xl p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage profile details, notifications, and security preferences.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link
              href="/settings/personal-info"
              className="motion-card rounded-2xl border border-border/80 bg-card/70 p-4"
            >
              <UserCircle2 className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Personal Info</p>
            </Link>
            <Link
              href="/settings/notifications"
              className="motion-card rounded-2xl border border-border/80 bg-card/70 p-4"
            >
              <Bell className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Notifications</p>
            </Link>
            <Link
              href="/settings/security"
              className="motion-card rounded-2xl border border-border/80 bg-card/70 p-4"
            >
              <Shield className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Security</p>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
