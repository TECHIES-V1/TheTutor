"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Menu } from "lucide-react";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center border-b border-primary/10 bg-background/80 px-4 backdrop-blur-md lg:hidden">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    aria-label="Open sidebar"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2 ml-2">
                    <div className="skeuo-gold flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0">
                        T
                    </div>
                    <span className="font-playfair font-bold text-primary">TheTutor</span>
                </div>
            </header>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    );
}
