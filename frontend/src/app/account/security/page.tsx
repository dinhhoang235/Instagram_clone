"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, ChevronLeft } from "lucide-react"
import { changePassword } from "@/lib/services/auth"

export default function SecurityPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    redirect("/login")
  }

  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword) return alert("Please enter your current password");
    if (!newPassword) return alert("Please enter a new password");
    if (newPassword !== confirmPassword) return alert("New passwords don't match");

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      alert("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            detail?: string;
            old_password?: string[];
            new_password?: string[];
            confirm_password?: string[];
            [key: string]: unknown;
          };
        };
      };

      const data = err.response?.data;
      const message =
        data?.detail ||
        data?.old_password?.[0] ||
        data?.new_password?.[0] ||
        data?.confirm_password?.[0] ||
        (typeof data === "object" ? Object.values(data)[0] : null) ||
        "Something went wrong";

      alert(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-20 lg:pt-4 lg:pb-4">
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border lg:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white hover:bg-slate-50"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-foreground">Security</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold p-6">Security</h1>
      </div>

      <section className="space-y-6">
        <div className="rounded-md overflow-hidden bg-white shadow-sm">
          <div className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Password must be at least 8 characters long.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    isLoading ||
                    !passwordData.currentPassword ||
                    !passwordData.newPassword ||
                    !passwordData.confirmPassword
                  }
                  className="w-full md:w-auto"
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="rounded-md overflow-hidden bg-white shadow-sm mt-6">
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
              <Button variant="outline">Enable Two-Factor Authentication</Button>
            </div>
          </div>
        </div>

        <div className="rounded-md overflow-hidden bg-white shadow-sm mt-6">
          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Deactivate Account</h4>
                <p className="text-sm text-muted-foreground">
                  Temporarily deactivate your account. You can reactivate it anytime by logging in.
                </p>
                <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50">
                  Deactivate Account
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
