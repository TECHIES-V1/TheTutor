"use client"

import { ShieldCheck, LogOut, KeyRound, LaptopMinimal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/AuthProvider"

export function Security() {
    const { user, logout } = useAuth()

    return (
        <div className="grid grid-cols-1 gap-6 pb-10 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="neo-surface rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                    Access
                </p>
                <h4 className="mt-3 text-2xl font-semibold text-foreground">Authentication is handled by OAuth</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                    Passwords are not stored or managed inside TheTutor. Your sign-in provider handles credentials, recovery, and account verification.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0 rounded-2xl border border-primary/12 bg-card/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <KeyRound className="h-4 w-4 text-primary" />
                            Sign-in Method
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Connected provider account
                        </p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-primary/12 bg-card/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            Protection Model
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Session-based access with provider-managed verification
                        </p>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-primary/12 bg-primary/[0.04] p-4">
                    <p className="text-sm font-medium text-foreground">What belongs here</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        This page focuses on account access, trust, and session actions. Password reset and credential changes should happen in your OAuth provider dashboard, not here.
                    </p>
                </div>
            </section>

            <section className="neo-surface rounded-3xl p-6">
                <h4 className="font-semibold text-foreground">Session actions</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                    Use this area for account-level actions on this device.
                </p>

                <div className="mt-6 space-y-4">
                    <div className="min-w-0 rounded-2xl border border-primary/12 bg-card/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <LaptopMinimal className="h-4 w-4 text-primary" />
                            Current account
                        </div>
                        <p className="mt-2 truncate text-sm text-muted-foreground">
                            {user?.email ?? "Signed-in account not available"}
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => {
                            void logout()
                        }}
                        className="skeuo-gold inline-flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </section>
        </div>
    )
}
