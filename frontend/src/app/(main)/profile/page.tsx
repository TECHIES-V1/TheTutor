"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MoonStar, Sun, UserCircle2, SlidersHorizontal, Shield } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ThemeMode, useThemeMode } from "@/components/providers/ThemeProvider";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/ui/PageLoader";

interface ProfilePayload {
  name: string;
  email: string;
  image?: string;
  preferences?: {
    theme?: ThemeMode;
  };
}

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: MoonStar },
];

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useThemeMode();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    api.patch("/user/preferences", { theme: nextTheme }).catch(() => {
      // Silent fail - theme is already applied locally
    });
  };

  if (isLoading || loading) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <PageLoader
          title="Loading profile..."
          subtitle="Pulling your account preferences and theme settings."
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="neo-surface rounded-2xl p-4 sm:p-6">
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
    <div className="py-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
        <motion.section
          className="neo-surface rounded-3xl p-4 sm:p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {profile?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.image}
                alt={profile?.name || "Profile"}
                className="h-16 w-16 rounded-full border border-primary/30 object-cover flex-shrink-0"
              />
            ) : (
              <div className="skeuo-gold flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold flex-shrink-0">
                {profile?.name?.[0] ?? user?.name?.[0] ?? "U"}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.12em] text-primary/80">Profile</p>
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {profile?.name ?? user?.name ?? "Learner"}
              </h1>
              <p className="text-sm text-muted-foreground truncate">
                {profile?.email ?? user?.email ?? ""}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="neo-surface rounded-3xl p-4 sm:p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">
                Choose the app appearance you want to keep active.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    onClick={() => handleThemeChange(option.value)}
                    variant="outline"
                    size="sm"
                    className={`inline-flex items-center justify-center gap-2 rounded-full border ${
                      isActive
                        ? "border-primary/35 bg-primary/[0.08] text-primary"
                        : "border-border/70 text-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="neo-surface rounded-3xl p-4 sm:p-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <h2 className="text-sm sm:text-base font-bold text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage profile details, preferences, and account access.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Link
              href="/settings/personal-info"
              className="card-leather motion-card flex min-w-0 items-center gap-3 rounded-2xl border border-primary/12 p-4"
            >
              <UserCircle2 className="h-5 w-5 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Profile</p>
                <p className="truncate text-xs text-muted-foreground">Identity and account details</p>
              </div>
            </Link>
            <Link
              href="/settings/notifications"
              className="card-leather motion-card flex min-w-0 items-center gap-3 rounded-2xl border border-primary/12 p-4"
            >
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Preferences</p>
                <p className="truncate text-xs text-muted-foreground">Theme and product defaults</p>
              </div>
            </Link>
            <Link
              href="/settings/security"
              className="card-leather motion-card flex min-w-0 items-center gap-3 rounded-2xl border border-primary/12 p-4"
            >
              <Shield className="h-5 w-5 text-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Account Access</p>
                <p className="truncate text-xs text-muted-foreground">OAuth sign-in and sessions</p>
              </div>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
