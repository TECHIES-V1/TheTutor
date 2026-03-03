"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { TutorAvatarMark } from "@/components/brand/TutorAvatarMark";

const SIDEBAR_COLLAPSE_KEY = "thetutor-sidebar-collapsed";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const showSidebar = !isLoading && !!user;

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
            if (stored === "true") {
                setIsSidebarCollapsed(true);
            }
        } catch {
            // ignore localStorage failures
        }
    }, []);

    useEffect(() => {
        try {
            window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(isSidebarCollapsed));
        } catch {
            // ignore localStorage failures
        }
    }, [isSidebarCollapsed]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        const syncOnResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(false);
            }
        };

        syncOnResize();
        window.addEventListener("resize", syncOnResize);
        return () => window.removeEventListener("resize", syncOnResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile Header */}
            <header className={`fixed top-0 left-0 right-0 z-30 h-16 items-center border-b border-primary/10 bg-background/80 px-4 backdrop-blur-md lg:hidden ${showSidebar ? "flex" : "hidden"}`}>
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2 ml-2">
                    <TutorAvatarMark size={32} className="shrink-0 rounded-lg" />
                    <span className="font-playfair font-bold text-primary">TheTutor</span>
                </div>
            </header>

            {showSidebar && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
                />
            )}

            {/* Main Content */}
            <main className={`flex-1 min-w-0 transition-[margin,padding] duration-300 ${
                showSidebar ? "pt-16 lg:pt-0" : "pt-0"
            } ${
                showSidebar ? (isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72") : "lg:ml-0"
            }`}>
                {children}
            </main>
        </div>
    );
}
