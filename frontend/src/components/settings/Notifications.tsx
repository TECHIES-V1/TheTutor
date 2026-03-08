"use client"

import { useState } from "react"

interface NotificationToggleProps {
    label: string
    description: string
    value: boolean
    onChange: (value: boolean) => void
}

function NotificationToggle({ label, description, value, onChange }: NotificationToggleProps) {
    return (
        <div className="flex items-start justify-between rounded-xl border border-border/80 bg-card/70 p-5">
            <div className="flex-1 pr-6">
                <h5 className="font-medium text-foreground">{label}</h5>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={value}
                onClick={() => onChange(!value)}
                className={`relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors ${value ? "bg-primary/80 border-primary/40" : "bg-muted border-border/80"
                    }`}
            >
                <div
                    className={`absolute h-5 w-5 top-0.5 rounded-full bg-background transition-transform ${value ? "translate-x-5" : "translate-x-0.5"
                        }`}
                />
            </button>
        </div>
    )
}

export function Notifications() {
    const [isLoading, setIsLoading] = useState(false)
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        courseUpdates: true,
    })

    const handleToggle = (key: keyof typeof preferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            // Backend integration coming later
            await new Promise(resolve => setTimeout(resolve, 500))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="neo-surface rounded-2xl p-6">
                <div>
                    <h4 className="font-semibold text-foreground">Notification Preferences</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        Choose how you want to receive updates and notifications.
                    </p>
                </div>

                <div className="mt-6 space-y-4">
                    <NotificationToggle
                        label="Email Notifications"
                        description="Receive email updates about your account activity and important announcements."
                        value={preferences.emailNotifications}
                        onChange={() => handleToggle("emailNotifications")}
                    />

                    <NotificationToggle
                        label="Course Updates"
                        description="Get notified when courses you're enrolled in are updated with new content."
                        value={preferences.courseUpdates}
                        onChange={() => handleToggle("courseUpdates")}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="skeuo-gold mt-6 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? "Saving..." : "Save Preferences"}
                </button>
            </div>
        </form>
    )
}
