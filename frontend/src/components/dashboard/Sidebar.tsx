"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Compass,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

interface NavChildItem {
  label: string;
  href: string;
  matchPrefix?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  children: NavChildItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    children: [
      { label: "Overview", href: "/dashboard" },
      { label: "Created Courses", href: "/dashboard/courses", matchPrefix: "/dashboard/courses" },
      { label: "Enrollments", href: "/dashboard/enrollments", matchPrefix: "/dashboard/enrollments" },
    ],
  },
  {
    label: "Courses",
    href: "/explore",
    icon: Compass,
    children: [
      { label: "Explore Library", href: "/explore", matchPrefix: "/explore" },
      { label: "Create Course", href: "/create-course", matchPrefix: "/create-course" },
      { label: "My Learning", href: "/dashboard/enrollments", matchPrefix: "/learn" },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      { label: "Profile", href: "/settings/personal-info", matchPrefix: "/settings/personal-info" },
      { label: "Notifications", href: "/settings/notifications", matchPrefix: "/settings/notifications" },
      { label: "Security", href: "/settings/security", matchPrefix: "/settings/security" },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function isChildActive(pathname: string, child: NavChildItem) {
  if (child.matchPrefix) {
    return pathname === child.href || pathname.startsWith(`${child.matchPrefix}/`);
  }
  return pathname === child.href;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isCourseWorkspace = pathname.startsWith("/learn/") || /^\/explore\/[^/]+$/.test(pathname);
  const lessonRouteMatch = pathname.match(/^\/learn\/([^/]+)\/lessons\/([^/]+)(?:\/quiz)?$/);
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
  const completionHref = activeCourseId ? `/learn/${activeCourseId}/complete` : "/dashboard";

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
        <nav className="flex flex-col gap-4 px-3 pt-5 flex-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const item = navItems.find((entry) => entry.href === href);
            const active =
              pathname === href ||
              pathname.startsWith(`${href}/`) ||
              item?.children.some((child) => isChildActive(pathname, child));

            return (
              <div key={href} className="group/navitem space-y-1">
                <Link
                  href={href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "border border-primary/25 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                  {label}
                </Link>

                {item?.children.length ? (
                  <div className="ml-6 max-h-40 overflow-hidden border-l border-primary/15 pl-3 opacity-100 transition-all duration-200 lg:max-h-0 lg:opacity-0 lg:group-hover/navitem:max-h-40 lg:group-hover/navitem:opacity-100 lg:group-focus-within/navitem:max-h-40 lg:group-focus-within/navitem:opacity-100">
                    {item.children.map((child) => {
                      const childActive = isChildActive(pathname, child);

                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={onClose}
                          className={`motion-link block rounded-lg px-2 py-1.5 text-xs ${
                            childActive
                              ? "bg-primary/12 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          {isCourseWorkspace && (
            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/8 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/70">
                Course Shortcuts
              </p>
              <Link
                href={currentLessonHref}
                onClick={onClose}
                className="motion-link flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-primary/10"
              >
                <BookOpenCheck className="h-3.5 w-3.5 text-primary/80" />
                Current Lesson
              </Link>
              <Link
                href={currentQuizHref}
                onClick={onClose}
                className="motion-link flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary/80" />
                Quiz + Feedback
              </Link>
              <Link
                href={completionHref}
                onClick={onClose}
                className="motion-link flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-primary/10"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-primary/80" />
                Completion
              </Link>
            </div>
          )}
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
