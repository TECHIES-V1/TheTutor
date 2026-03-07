"use client"

import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { BadgeCheck, ExternalLink, GraduationCap, Mail, UserCircle2 } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"

export function PersonalInfo() {
    const { user, isLoading: isAuthLoading } = useAuth()

    if (isAuthLoading) {
        return (
            <div className="neo-surface rounded-2xl p-6 max-w-5xl">
                <div className="text-sm text-muted-foreground">Loading your profile…</div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6 pb-10 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="neo-surface rounded-3xl p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Avatar className="h-24 w-24 ring-2 ring-primary/20">
                        <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "Profile"} />
                        <AvatarFallback className="bg-muted text-lg font-semibold">
                            {user?.name?.[0] ?? "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/75">
                            Profile
                        </p>
                        <h4 className="mt-2 text-2xl font-semibold text-foreground">
                            {user?.name ?? "Learner"}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Your account identity is synced from your OAuth provider, so the basics stay consistent everywhere you sign in.
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0 rounded-2xl border border-primary/12 bg-card/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <UserCircle2 className="h-4 w-4 text-primary" />
                            Display Name
                        </div>
                        <p className="mt-2 truncate text-sm text-muted-foreground">{user?.name ?? "Not available"}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-primary/12 bg-card/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Mail className="h-4 w-4 text-primary" />
                            Sign-in Email
                        </div>
                        <p className="mt-2 truncate text-sm text-muted-foreground">{user?.email ?? "Not available"}</p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-primary/12 bg-card/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <BadgeCheck className="h-4 w-4 text-primary" />
                            Account Status
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Active and ready for learning.
                        </p>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-primary/12 bg-card/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            Onboarding
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {user?.onboardingCompleted ? "Completed" : "Still in progress"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="neo-surface rounded-3xl p-6">
                <h4 className="font-semibold text-foreground">How profile details work</h4>
                <p className="mt-2 text-sm text-muted-foreground">
                    TheTutor currently trusts your connected provider for name, email, and avatar. That keeps account identity simple and reduces duplicated account management.
                </p>

                <div className="mt-6 space-y-3">
                    <div className="rounded-2xl border border-primary/12 bg-primary/[0.04] p-4">
                        <p className="text-sm font-medium text-foreground">Managed by your sign-in provider</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            If you want to change your profile photo or primary account name, update it at the provider level and it will flow back here.
                        </p>
                    </div>
                    <Link
                        href="/profile"
                        className="flex items-center justify-between rounded-2xl border border-primary/12 bg-card/60 p-4 text-sm text-foreground transition hover:bg-primary/[0.04]"
                    >
                        <span>Open your profile overview</span>
                        <ExternalLink className="h-4 w-4 text-primary" />
                    </Link>
                </div>
            </section>
        </div>
    )
}
