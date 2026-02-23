"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { CourseEmptyState } from "@/components/dashboard/CourseEmptyState";
import { Flame, BookOpen, Clock } from "lucide-react";

function getTimeGreeting(name?: string) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${greeting}, ${name.split(" ")[0]}` : greeting;
}

const stats = [
  { label: "Day Streak", value: "0", icon: Flame, suffix: "days" },
  { label: "Courses Enrolled", value: "0", icon: BookOpen, suffix: "courses" },
  { label: "Hours Learned", value: "0", icon: Clock, suffix: "hours" },
];

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="neo-surface flex h-14 w-14 items-center justify-center rounded-2xl">
          <span className="skeuo-gold flex h-9 w-9 items-center justify-center rounded-lg font-playfair font-bold text-sm">
            T
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <main className="ml-64 flex-1 p-8">
        {/* Gradient accent */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

        <div className="relative z-10 max-w-5xl">
          {/* Welcome heading */}
          <div className="mb-8">
            <h1 className="font-playfair text-3xl font-bold text-foreground">
              {getTimeGreeting(user?.name)} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here&apos;s what&apos;s happening with your learning today.
            </p>
          </div>

          {/* Stats row */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value, icon: Icon, suffix }) => (
              <div key={label} className="neo-surface rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className="neo-inset flex h-8 w-8 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="mt-3 font-playfair text-3xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{suffix}</p>
              </div>
            ))}
          </div>

          {/* Courses section */}
          <div>
            <h2 className="mb-4 font-playfair text-xl font-bold text-foreground">My Courses</h2>
            <CourseEmptyState />
          </div>
        </div>
      </main>
    </div>
  );
}
