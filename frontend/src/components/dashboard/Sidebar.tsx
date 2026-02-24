"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, Settings, LogOut, Plus, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Explore Courses", href: "/explore", icon: Compass },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside
        className={`neo-surface fixed left-0 top-0 bottom-0 z-50 flex w-64 flex-col border-r border-primary/20 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="skeuo-gold flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold shrink-0">
              T
            </div>
            <div>
              <p className="font-playfair text-lg font-bold text-primary leading-none">TheTutor</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
                AI Learning Coach
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Create Course CTA */}
        <div className="px-4 pt-5">
          <Button
            asChild
            size="sm"
            onClick={onClose}
            className="skeuo-gold w-full rounded-full hover:!opacity-100 gap-2"
          >
            <Link href="/create-course">
              <Plus className="h-4 w-4" />
              New Course
            </Link>
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 pt-5 flex-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        {user && (
          <div className="border-t border-primary/10 px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-9 w-9 rounded-full object-cover border border-primary/20"
                />
              ) : (
                <div className="skeuo-gold flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0">
                  {user.name?.[0] ?? "U"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                onClose?.();
              }}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
