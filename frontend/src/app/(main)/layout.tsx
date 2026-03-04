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
            <header className={`fixed top-0 left-0 right-0 z-30 h-16 items-center border-b border-primary/10 bg-background/80 px-4 backdrop-blur-md transition-transform duration-300 lg:hidden ${showSidebar ? "flex" : "hidden"} ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}>
                <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2 ml-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="TheTutor" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
                    <span className="font-playfair font-bold text-primary">TheTutor</span>
                </div>
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
            <main className={`flex-1 min-w-0 transition-[margin,padding] duration-300 ${showSidebar ? "pt-16 lg:pt-0" : "pt-0"
                } ${showSidebar ? (isSidebarCollapsed ? "lg:ml-16" : "lg:ml-72") : "lg:ml-0"
                }`}>
                {children}
            </main>
            {showSidebar && <GenerationNotifier />}
        </div>
    );
}
