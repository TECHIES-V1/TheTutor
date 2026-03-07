"use client"

import { LaptopMinimal, MoonStar, Sparkles, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeMode, useThemeMode } from "@/components/providers/ThemeProvider"
import { api } from "@/lib/api"

const themeOptions: Array<{
    value: ThemeMode
    label: string
    icon: typeof LaptopMinimal
}> = [
    { value: "system", label: "System", icon: LaptopMinimal },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: MoonStar },
]

export function Notifications() {
    const { theme, setTheme } = useThemeMode()

    const handleThemeChange = (nextTheme: ThemeMode) => {
        setTheme(nextTheme)
        void api.patch("/user/preferences", { theme: nextTheme }).catch(() => {
            // Keep the locally applied preference even if the request fails.
        })
    }

    return (
        <div className="grid grid-cols-1 gap-6 pb-10 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="neo-surface rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                    Preferences
                </p>
                <h4 className="mt-3 text-2xl font-semibold text-foreground">Appearance and product defaults</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                    Keep the app comfortable for longer sessions and make sure your product experience is consistent across devices.
                </p>

                <div className="mt-8 rounded-2xl border border-primary/12 bg-card/60 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h5 className="font-medium text-foreground">Theme mode</h5>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Pick a fixed mode or follow your device automatically.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {themeOptions.map((option) => {
                                const Icon = option.icon
                                const isActive = theme === option.value
                                return (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleThemeChange(option.value)}
                                        variant="outline"
                                        size="sm"
                                        className={`inline-flex items-center justify-center gap-2 rounded-full border ${
                                            isActive
                                                ? "border-primary/35 bg-primary/[0.08] text-primary"
                                                : "border-border/70 text-foreground hover:border-primary/30"
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {option.label}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="neo-surface rounded-3xl p-6">
                <h4 className="font-semibold text-foreground">Communication settings</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                    Notification controls are intentionally minimal right now to avoid fake preferences that do nothing.
                </p>

                <div className="mt-6 rounded-2xl border border-primary/12 bg-primary/[0.04] p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Current status
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        TheTutor will use essential product messaging only. Granular email and course update controls can be added here later when they are connected to real delivery logic.
                    </p>
                </div>
            </section>
        </div>
    )
}
