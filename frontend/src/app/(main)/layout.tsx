"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { GenerationNotifier } from "@/components/onboarding/GenerationNotifier";


const SIDEBAR_COLLAPSE_KEY = "thetutor-sidebar-collapsed";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        try {
            return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "true";
        } catch {
            return false;
        }
    });
    const { user, isLoading } = useAuth();
    const showSidebar = !isLoading && !!user;

    const [headerVisible, setHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            if (Math.abs(y - lastScrollY.current) < 5) return;
            setHeaderVisible(y < lastScrollY.current || y < 60);
            lastScrollY.current = y;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(isSidebarCollapsed));
        } catch {
            // ignore localStorage failures
        }
    }, [isSidebarCollapsed]);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile Header */}
            <header className={`fixed top-0 left-0 right-0 z-30 h-14 items-center gap-3 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 backdrop-blur-xl transition-transform duration-300 lg:hidden ${showSidebar ? "flex" : "hidden"} ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}>
                <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-primary/5 text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Open sidebar"
                >
                    <Menu className="h-4 w-4" />
                </button>
                <div className="flex flex-1 items-center justify-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="TheTutor" className="h-7 w-7 shrink-0 rounded-lg object-contain" />
                    <span className="font-playfair text-sm font-bold text-primary tracking-wide">TheTutor</span>
                </div>
                {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt={user.name}
                        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-primary/20"
                    />
                ) : (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{user?.name?.[0] ?? ""}</span>
                    </div>
                )}
            </header>

            {showSidebar && (
                <Sidebar
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
                />
            )}

            {/* Main Content */}
            <main className={`flex-1 min-w-0 transition-[margin,padding] duration-300 ${showSidebar ? "pt-14 lg:pt-0" : "pt-0"
                } ${showSidebar ? (isSidebarCollapsed ? "lg:ml-[4.5rem]" : "lg:ml-72") : "lg:ml-0"
                }`}>
                {children}
            </main>
            {showSidebar && <GenerationNotifier />}
        </div>
    );
}
