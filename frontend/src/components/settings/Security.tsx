"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Security() {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })
    const [error, setError] = useState("")

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError("All fields are required")
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match")
            return
        }

        if (formData.newPassword.length < 8) {
            setError("Password must be at least 8 characters long")
            return
        }

        setIsLoading(true)
        try {
            console.log("Updating password:", {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            })
            // Backend integration coming later
            await new Promise(resolve => setTimeout(resolve, 500))

            // Reset form on success
            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="neo-surface rounded-2xl p-6">
                <h4 className="font-semibold text-foreground">Security</h4>
                <p className="text-sm text-muted-foreground mt-1">
                    Update your password regularly to keep your account secure.
                </p>

                <div className="mt-6 space-y-5">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                            Current Password
                        </label>
                        <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="bg-card border-border/80"
                            placeholder="Enter your current password"
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                            New Password
                        </label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            className="bg-card border-border/80"
                            placeholder="Enter your new password"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                            Confirm New Password
                        </label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="bg-card border-border/80"
                            placeholder="Confirm your new password"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="skeuo-gold mt-2 w-full sm:w-auto"
                    >
                        {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                </div>
            </div>
        </form>
    )
}
