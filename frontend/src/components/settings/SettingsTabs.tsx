"use client"

import { usePathname, useRouter } from "next/navigation"
import { User, Shield, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
    { id: "personal-info", label: "Profile", icon: User, href: "/settings/personal-info" },
    { id: "security", label: "Access", icon: Shield, href: "/settings/security" },
    { id: "notifications", label: "Preferences", icon: SlidersHorizontal, href: "/settings/notifications" },
]

export function SettingsTabs() {
    const pathname = usePathname()
    const router = useRouter()

    const getCurrentTab = () => {
        const segment = pathname.split("/").pop()
        return segment || "personal-info"
    }

    const currentTab = getCurrentTab()

    return (
        <div className="grid gap-3 p-4 sm:grid-cols-3">
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentTab === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => router.push(tab.href)}
                        className={cn(
                            "flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
                            isActive
                                ? "border-primary/25 bg-primary/[0.08] text-primary"
                                : "border-border/70 bg-background/30 text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.03] hover:text-foreground"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
