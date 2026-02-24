"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"

export function PersonalInfo() {
    const { user, isLoading: isAuthLoading } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
    })

    useEffect(() => {
        if (!user) return
        setFormData({
            name: user.name ?? "",
            email: user.email ?? "",
        })
    }, [user])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            console.log("Updating personal info:", formData)
            // Backend integration coming later
            await new Promise(resolve => setTimeout(resolve, 500))
        } finally {
            setIsLoading(false)
        }
    }

    const handleProfilePictureEdit = async () => {
        console.log("Edit profile picture")
        // Backend integration coming later
    }

    if (isAuthLoading) {
        return (
            <div className="neo-surface rounded-2xl p-6 max-w-5xl">
                <div className="text-sm text-muted-foreground">Loading your profile…</div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-5xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr] pb-10">
                {/* Profile Picture Section */}
                <div className="flex flex-col gap-4">
                    <div className="neo-surface rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-foreground">Profile Picture</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Keep your profile polished and recognizable.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-col items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-24 w-24 ring-2 ring-primary/30">
                                    <AvatarImage src={user?.image ?? ""} alt={user?.name ?? "Profile"} />
                                    <AvatarFallback className="bg-muted text-lg font-semibold">
                                        {user?.name?.[0] ?? "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    type="button"
                                    onClick={handleProfilePictureEdit}
                                    className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-card/90 text-primary shadow-lg transition hover:bg-card"
                                    aria-label="Change profile picture"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Your profile photo is managed by your Google account.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Fields Section */}
                <div className="neo-surface rounded-2xl p-6">
                    <h4 className="font-semibold text-foreground">Personal Details</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        Update the information associated with your account.
                    </p>
                    <div className="mt-6 space-y-5">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                                Name
                            </label>
                            <Input
                                id="fullName"
                                name="fullName"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="bg-card border-border/80"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="bg-card border-border/80"
                                placeholder="Enter your email address"
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={isLoading || !user}
                                className="skeuo-gold w-full sm:w-auto"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
