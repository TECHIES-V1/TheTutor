"use client"

import { usePathname, useRouter } from "next/navigation"
import { User, Lock, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
    { id: "personal-info", label: "Personal Info", icon: User, href: "/settings/personal-info" },
    { id: "security", label: "Security", icon: Lock, href: "/settings/security" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/settings/notifications" },
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
        <div className="flex flex-wrap gap-3 p-4">
            {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentTab === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => router.push(tab.href)}
                        className={cn(
                            "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                            isActive
                                ? "border-primary/40 bg-primary/15 text-primary"
                                : "border-border/80 bg-background/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
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
