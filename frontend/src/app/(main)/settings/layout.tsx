"use client"

import { SettingsTabs } from "@/components/settings/SettingsTabs"

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex w-full min-w-0 flex-col overflow-x-hidden min-h-[calc(100svh-4rem)] sm:min-h-[calc(100dvh-4rem)] lg:min-h-screen">
            <div className="pt-6 pb-6">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <div className="neo-surface rounded-3xl p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                            Settings
                        </p>
                        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-playfair text-3xl font-bold text-foreground">
                                    Account Hub
                                </h3>
                                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    Manage the parts of your account that actually matter here:
                                    identity, access, and product preferences.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl w-full px-4 sm:px-6">
                <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                    <SettingsTabs />
                </div>
            </div>

            <div className="flex-1 pt-10 pb-34">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
