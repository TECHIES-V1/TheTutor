"use client"

import { SettingsTabs } from "@/components/settings/SettingsTabs"

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex w-full min-w-0 flex-col overflow-x-hidden min-h-[calc(100svh-4rem)] sm:min-h-[calc(100dvh-4rem)] lg:min-h-screen">
            {/* Settings Header */}
            <div className="pt-6 pb-6">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    <h3 className="font-playfair text-3xl font-bold text-foreground">
                        Settings
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                        Manage your account settings and preferences with a clear, focused experience.
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mx-auto max-w-5xl w-full px-4 sm:px-6">
                <div className="rounded-2xl border border-border/80 bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                    <SettingsTabs />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 pt-10 pb-34">
                <div className="mx-auto max-w-5xl px-4 sm:px-6">
                    {children}
                </div>
            </div>
        </div>
    )
}
