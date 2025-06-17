"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { Camera, X, Eye, EyeOff, Globe, Lock, Users } from "lucide-react"

export default function EditProfilePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    redirect("/login")
  }

  // Profile form state
  const [profileData, setProfileData] = useState({
    username: "john_doe",
    name: "John Doe",
    bio: "📸 Photographer & Content Creator\n🌍 Traveling the world\n📧 john@example.com",
    website: "www.johndoe.com",
    email: "john@example.com",
    phoneNumber: "+1 (555) 123-4567",
    gender: "prefer-not-to-say",
    avatar: "/placeholder-user.jpg",
  })

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    isPrivate: false,
    allowTagging: true,
    showActivity: true,
    allowStoryResharing: true,
    allowComments: "everyone",
    allowMessages: "everyone",
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Profile updated:", profileData)
      // Show success message or redirect
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Privacy settings updated:", privacySettings)
    } catch (error) {
      console.error("Failed to update privacy settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Password updated")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      console.error("Failed to update password:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData({ ...profileData, avatar: e.target?.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setProfileData({ ...profileData, avatar: "" })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      {/* Profile Picture */}
                      <div className="flex items-center space-x-6">
                        <div className="relative">
                          <Avatar className="w-24 h-24">
                            <AvatarImage src={profileData.avatar || "/placeholder.svg"} alt="Profile picture" />
                            <AvatarFallback>{profileData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {profileData.avatar && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                              onClick={removeAvatar}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <Button type="button" variant="outline" className="cursor-pointer">
                              <Camera className="w-4 h-4 mr-2" />
                              Change Photo
                            </Button>
                          </Label>
                          <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <p className="text-sm text-muted-foreground">
                            Recommended: Square JPG, PNG, or GIF, at least 320 pixels wide and tall.
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profileData.username}
                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                            placeholder="Username"
                          />
                          <p className="text-sm text-muted-foreground">
                            You can only change your username twice within 14 days.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            placeholder="Full name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            placeholder="Email address"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={profileData.phoneNumber}
                            onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                            placeholder="Phone number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input
                            id="website"
                            type="url"
                            value={profileData.website}
                            onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                            placeholder="Website URL"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender">Gender</Label>
                          <Select
                            value={profileData.gender}
                            onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Tell people about yourself..."
                          rows={4}
                          maxLength={150}
                        />
                        <p className="text-sm text-muted-foreground text-right">{profileData.bio.length}/150</p>
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePrivacySubmit} className="space-y-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Private Account</Label>
                            <p className="text-sm text-muted-foreground">
                              When your account is private, only people you approve can see your photos and videos.
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.isPrivate}
                            onCheckedChange={(checked) =>
                              setPrivacySettings({ ...privacySettings, isPrivate: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Allow Tagging</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow others to tag you in their posts and stories.
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.allowTagging}
                            onCheckedChange={(checked) =>
                              setPrivacySettings({ ...privacySettings, allowTagging: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Activity Status</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow others to see when you were last active.
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.showActivity}
                            onCheckedChange={(checked) =>
                              setPrivacySettings({ ...privacySettings, showActivity: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Story Resharing</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow others to reshare your stories to their stories.
                            </p>
                          </div>
                          <Switch
                            checked={privacySettings.allowStoryResharing}
                            onCheckedChange={(checked) =>
                              setPrivacySettings({ ...privacySettings, allowStoryResharing: checked })
                            }
                          />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label className="text-base font-medium">Comments</Label>
                          <p className="text-sm text-muted-foreground">Control who can comment on your posts.</p>
                          <Select
                            value={privacySettings.allowComments}
                            onValueChange={(value) => setPrivacySettings({ ...privacySettings, allowComments: value })}
                          >
                            <SelectTrigger className="w-full md:w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="everyone">
                                <div className="flex items-center">
                                  <Globe className="w-4 h-4 mr-2" />
                                  Everyone
                                </div>
                              </SelectItem>
                              <SelectItem value="followers">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  People you follow
                                </div>
                              </SelectItem>
                              <SelectItem value="off">
                                <div className="flex items-center">
                                  <Lock className="w-4 h-4 mr-2" />
                                  Off
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <Label className="text-base font-medium">Messages</Label>
                          <p className="text-sm text-muted-foreground">Control who can send you direct messages.</p>
                          <Select
                            value={privacySettings.allowMessages}
                            onValueChange={(value) => setPrivacySettings({ ...privacySettings, allowMessages: value })}
                          >
                            <SelectTrigger className="w-full md:w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="everyone">
                                <div className="flex items-center">
                                  <Globe className="w-4 h-4 mr-2" />
                                  Everyone
                                </div>
                              </SelectItem>
                              <SelectItem value="followers">
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  People you follow
                                </div>
                              </SelectItem>
                              <SelectItem value="off">
                                <div className="flex items-center">
                                  <Lock className="w-4 h-4 mr-2" />
                                  Off
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                        {isLoading ? "Saving..." : "Save Privacy Settings"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent>
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

                      <Button
                        type="submit"
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
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                      </p>
                      <Button variant="outline">Enable Two-Factor Authentication</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
