"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookMarked,
  BookOpenCheck,
  ChevronUp,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Plus,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useState } from "react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const navItems = [
  { label: "Overview",    href: "/dashboard",             icon: LayoutDashboard, exact: true },
  { label: "My Courses",  href: "/dashboard/courses",     icon: BookMarked },
  { label: "Enrollments", href: "/dashboard/enrollments", icon: GraduationCap },
  { label: "Explore",     href: "/explore",               icon: Compass },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isCourseWorkspace =
    pathname.startsWith("/learn/") || /^\/explore\/[^/]+$/.test(pathname);
  const lessonRouteMatch = pathname.match(
    /^\/learn\/([^/]+)\/lessons\/([^/]+)(?:\/quiz)?$/
  );
  const completeRouteMatch = pathname.match(/^\/learn\/([^/]+)\/complete$/);
  const previewRouteMatch = pathname.match(/^\/explore\/([^/]+)$/);

  const activeCourseId =
    lessonRouteMatch?.[1] ?? completeRouteMatch?.[1] ?? previewRouteMatch?.[1] ?? null;
  const activeLessonId = lessonRouteMatch?.[2] ?? null;
  const currentLessonHref =
    activeCourseId && activeLessonId
      ? `/learn/${activeCourseId}/lessons/${activeLessonId}`
      : "/dashboard";
  const currentQuizHref =
    activeCourseId && activeLessonId
      ? `/learn/${activeCourseId}/lessons/${activeLessonId}/quiz`
      : "/dashboard";
  const completionHref = activeCourseId
    ? `/learn/${activeCourseId}/complete`
    : "/dashboard";
  const handleCloseSidebar = () => {
    setProfileOpen(false);
    onClose?.();
  };
  const handleLogoClick = () => {
    if (isCollapsed) {
      onToggleCollapse?.();
    }
  };

  const textReveal = cx(
    "overflow-hidden whitespace-nowrap transition-all duration-300",
    isCollapsed
      ? "lg:max-w-0 lg:opacity-0"
      : "max-w-[10rem] opacity-100"
  );

  const linkBase = cx(
    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
    "transition-all duration-200",
    isCollapsed
      ? "lg:mx-auto lg:h-10 lg:w-10 lg:justify-center lg:gap-0 lg:px-0"
      : ""
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleCloseSidebar}
      />

      <aside
        className={cx(
          "group/sidebar neo-surface fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-primary/10 transition-[transform,width] duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          isCollapsed ? "w-72 lg:w-16" : "w-72",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-3 pt-5 pb-4">
          <button
            type="button"
            onClick={handleLogoClick}
            className={cx(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/15 bg-primary/5 shadow-neo-card transition-all duration-300",
              isCollapsed
                ? "h-10 w-10 cursor-pointer lg:h-9 lg:w-9"
                : "h-9 w-9 cursor-default"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Sidebar logo"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TheTutor" className="h-full w-full object-contain p-1.5" />
          </button>
          <span className={cx("font-playfair text-base font-bold text-primary", textReveal)}>
            TheTutor
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cx(
                "hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isCollapsed ? "lg:hidden" : "lg:inline-flex"
              )}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCloseSidebar}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleCloseSidebar}
                title={isCollapsed ? item.label : undefined}
                className={cx(
                  linkBase,
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon
                  className={cx(
                    "h-4 w-4 shrink-0 transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-75"
                  )}
                />
                <span className={textReveal}>{item.label}</span>
              </Link>
            );
          })}

          {/* Separator */}
          <div className="my-2 h-px bg-border/40" />

          {/* Create Course */}
          <Link
            href="/create-course"
            onClick={handleCloseSidebar}
            title={isCollapsed ? "Create Course" : undefined}
            className={cx(
              linkBase,
              "font-medium",
              pathname.startsWith("/create-course")
                ? "text-primary"
                : "text-primary/70 hover:bg-primary/[0.04] hover:text-primary"
            )}
          >
            {pathname.startsWith("/create-course") && (
              <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
            )}
            <Plus className="h-4 w-4 shrink-0 text-primary" />
            <span className={textReveal}>Create Course</span>
          </Link>

          {/* Course workspace shortcuts */}
          {isCourseWorkspace && (
            <div
              className={cx(
                "mt-3 space-y-0.5 rounded-xl border border-primary/20 bg-primary/8 p-2 shadow-neo-inset",
                isCollapsed
                  ? "lg:hidden"
                  : ""
              )}
            >
              <p className={cx("mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-primary/60", textReveal)}>
                Course
              </p>
              <Link
                href={currentLessonHref}
                onClick={handleCloseSidebar}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-primary/10"
              >
                <BookOpenCheck className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                <span className={textReveal}>Current Lesson</span>
              </Link>
              <Link
                href={currentQuizHref}
                onClick={handleCloseSidebar}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                <span className={textReveal}>Quiz + Feedback</span>
              </Link>
              <Link
                href={completionHref}
                onClick={handleCloseSidebar}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-primary/10"
              >
                <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                <span className={textReveal}>Completion</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        {user && (
          <div className="relative px-2 pb-3">
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition-all duration-200",
                "hover:text-foreground",
                isCollapsed
                  ? "lg:mx-auto lg:h-10 lg:w-10 lg:justify-center lg:gap-0 lg:px-0"
                  : ""
              )}
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-primary/25"
                />
              ) : (
                <div className="skeuo-gold flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {user.name?.[0] ?? "U"}
                </div>
              )}
              <div className={cx("min-w-0 flex-1 text-left", textReveal)}>
                <p className="truncate text-sm font-semibold leading-none text-foreground">
                  {user.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <ChevronUp
                className={cx(
                  "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                  textReveal,
                  isCollapsed && "lg:hidden",
                  !profileOpen && "rotate-180"
                )}
              />
            </button>

            {profileOpen && !isCollapsed && (
              <div className="absolute bottom-full left-2 right-2 mb-2 rounded-xl border border-primary/15 bg-card p-1 shadow-neo-raised">
                <Link
                  href="/profile"
                  onClick={() => {
                    setProfileOpen(false);
                    handleCloseSidebar();
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary/5"
                >
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="neo-surface mx-4 w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground">Sign Out</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to sign out?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowLogoutConfirm(false);
                  handleCloseSidebar();
                }}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
