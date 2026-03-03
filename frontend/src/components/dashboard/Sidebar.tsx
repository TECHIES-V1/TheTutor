"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  Compass,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sparkles,
  UserCircle2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { TutorAvatarMark } from "@/components/brand/TutorAvatarMark";

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
    label: "Discover",
    href: "/explore",
    icon: Compass,
    children: [
      { label: "Explore Library", href: "/explore", matchPrefix: "/explore" },
      { label: "Create Course", href: "/create-course", matchPrefix: "/create-course" },
      { label: "My Learning", href: "/dashboard/enrollments", matchPrefix: "/learn" },
    ],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserCircle2,
    children: [{ label: "Account Center", href: "/profile", matchPrefix: "/profile" }],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isChildActive(pathname: string, child: NavChildItem) {
  if (child.matchPrefix) {
    return pathname === child.href || pathname.startsWith(`${child.matchPrefix}/`);
  }
  return pathname === child.href;
}

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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

  const textRevealClass = cx(
    "overflow-hidden whitespace-nowrap transition-all duration-300",
    isCollapsed
      ? "lg:max-w-0 lg:translate-x-1 lg:opacity-0 lg:group-hover/sidebar:max-w-[11rem] lg:group-hover/sidebar:translate-x-0 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-w-[11rem] lg:group-focus-within/sidebar:translate-x-0 lg:group-focus-within/sidebar:opacity-100"
      : "max-w-[11rem] translate-x-0 opacity-100"
  );
  const desktopDetailsClass = cx(
    "transition-all duration-300",
    isCollapsed
      ? "lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:group-hover/sidebar:max-h-96 lg:group-hover/sidebar:opacity-100 lg:group-focus-within/sidebar:max-h-96 lg:group-focus-within/sidebar:opacity-100"
      : "max-h-96 opacity-100"
  );
  const buttonJustifyClass = isCollapsed
    ? "lg:justify-center lg:px-0 lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:px-3 lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:px-3"
    : "";

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={cx(
          "group/sidebar neo-surface fixed bottom-0 left-0 top-0 z-50 flex flex-col border-r border-primary/20 transition-[transform,width] duration-300 ease-in-out lg:translate-x-0",
          isCollapsed ? "w-72 lg:w-20 lg:hover:w-72 lg:focus-within:w-72" : "w-72",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-primary/10 px-4 py-5">
          <div className="flex items-center gap-3">
            <TutorAvatarMark size={36} className="shrink-0 rounded-lg" />
            <div className={textRevealClass}>
              <p className="font-playfair text-lg font-bold leading-none text-primary">TheTutor</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                AI Learning Coach
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-md border border-border bg-card/60 p-1.5 text-muted-foreground transition hover:text-foreground lg:inline-flex"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground transition-colors hover:text-primary lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-5">
          <Button
            asChild
            size="sm"
            onClick={onClose}
            className={cx(
              "skeuo-gold w-full gap-2 rounded-full hover:!opacity-100",
              buttonJustifyClass
            )}
          >
            <Link href="/create-course" title={isCollapsed ? "New Course" : undefined}>
              <Plus className="h-4 w-4" />
              <span className={textRevealClass}>New Course</span>
            </Link>
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pt-5">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              item.children.some((child) => isChildActive(pathname, child));

            return (
              <div key={item.href} className="group/navitem space-y-1">
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  className={cx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "border border-primary/25 bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cx("h-4 w-4", active && "text-primary")} />
                  <span className={textRevealClass}>{item.label}</span>
                </Link>

                {item.children.length > 0 && (
                  <div className={cx("ml-6 overflow-hidden border-l border-primary/15 pl-3", desktopDetailsClass)}>
                    {item.children.map((child) => {
                      const childActive = isChildActive(pathname, child);
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={onClose}
                          className={cx(
                            "motion-link block rounded-lg px-2 py-1.5 text-xs",
                            childActive
                              ? "bg-primary/12 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <span className="whitespace-nowrap">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {isCourseWorkspace && (
            <div className={cx("space-y-2 rounded-2xl border border-primary/20 bg-primary/10 p-3", desktopDetailsClass)}>
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

        {user && (
          <div className="border-t border-primary/10 px-4 py-4">
            <Link
              href="/profile"
              onClick={onClose}
              title={isCollapsed ? "Profile" : undefined}
              className="mb-3 flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-muted/60"
            >
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-9 w-9 rounded-full border border-primary/20 object-cover"
                />
              ) : (
                <div className="skeuo-gold flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {user.name?.[0] ?? "U"}
                </div>
              )}
              <div className={cx("min-w-0", textRevealClass)}>
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <UserCircle2 className={cx("ml-auto h-4 w-4 text-muted-foreground", textRevealClass)} />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                onClose?.();
              }}
              className={cx(
                "w-full justify-start gap-2 text-muted-foreground hover:bg-muted hover:text-foreground",
                buttonJustifyClass
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className={textRevealClass}>Sign Out</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
