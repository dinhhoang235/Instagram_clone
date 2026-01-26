"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"
import { Camera, X, ChevronLeft } from "lucide-react"
import type { GenderOption, AllowOption } from "@/types/profile"
import { getMyProfile, updateMyProfile } from "@/lib/services/profile"

export default function EditProfilePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    redirect("/login")
  }

  // Profile form state
  const [profileData, setProfileData] = useState({
    username: "",
    name: "",
    bio: "",
    website: "",
    email: "",
    phoneNumber: "",
    gender: "other" as GenderOption,
    avatar: "/placeholder-user.jpg" as string,
    avatarFile: null as File | null,
  })

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    isPrivate: false,
    allowTagging: true,
    showActivity: true,
    allowStoryResharing: true,
    allowComments: "everyone" as AllowOption,
    allowMessages: "everyone" as AllowOption,
  })

  // Password change state


  const [isLoading, setIsLoading] = useState(false)

  // load profile from API
  useEffect(() => {
    async function fetchProfile() {
      const profile = await getMyProfile()
      setProfileData((prev) => ({
        ...prev,
        username: profile.username,
        name: profile.full_name,
        bio: profile.bio || "",
        website: profile.website || "",
        email: profile.email || "",
        phoneNumber: profile.phone_number || "",
        gender: profile.gender ?? "other",
        avatar: profile.avatar || "/placeholder-user.jpg",
        avatarFile: profile.avatarFile || null,
      }))
      setPrivacySettings({
        isPrivate: profile.is_private,
        allowTagging: profile.allow_tagging,
        showActivity: profile.show_activity,
        allowStoryResharing: profile.allow_story_resharing,
        allowComments: profile.allow_comments || "everyone",
        allowMessages: profile.allow_messages || "everyone",
      })
    }
    fetchProfile()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("full_name", profileData.name)
      formData.append("bio", profileData.bio)
      formData.append("website", profileData.website)
      formData.append("phone_number", profileData.phoneNumber)
      formData.append("gender", profileData.gender)

      // Nếu có avatarFile thì append
      if (profileData.avatarFile) {
        formData.append("avatarFile", profileData.avatarFile)
      }

      // Các trường privacy
      formData.append("is_private", String(privacySettings.isPrivate))
      formData.append("allow_tagging", String(privacySettings.allowTagging))
      formData.append("show_activity", String(privacySettings.showActivity))
      formData.append("allow_story_resharing", String(privacySettings.allowStoryResharing))
      formData.append("allow_comments", privacySettings.allowComments)
      formData.append("allow_messages", privacySettings.allowMessages)

      const updated = await updateMyProfile(formData)

      setProfileData((prev) => ({
        ...prev,
        name: updated.full_name ?? "",
        bio: updated.bio ?? "",
        website: updated.website ?? "",
        phoneNumber: updated.phone_number ?? "",
        gender: updated.gender ?? "other",
        avatar: updated.avatar ?? "/placeholder-user.jpg",
        avatarFile: null,
      }))
      alert("Profile updated successfully")
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setIsLoading(false)
    }
  }




  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileData((prev) => ({
          ...prev,
          avatar: e.target?.result as string,
          avatarFile: file,
        }))
      }
      reader.readAsDataURL(file)
    }
  }


  const removeAvatar = async () => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", "") 

      const updated = await updateMyProfile(formData)

      setProfileData((prev) => ({
        ...prev,
        avatar: updated.avatar,
        avatarFile: null,
      }))
    } catch (error) {
      console.error("Failed to remove avatar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <main className="flex-1">
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
                <h1 className="flex-1 text-center font-semibold text-foreground">Edit Profile</h1>
                <div className="w-8" />
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold p-6">Edit Profile</h1>
            </div>

            <div className="rounded-md overflow-hidden bg-white shadow-sm">
              <div className="p-6">
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeAvatar();
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <Button
                              type="button"
                              variant="outline"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                document.getElementById("avatar-upload")?.click()
                              }}
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Change Photo
                            </Button>
                          </Label>
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
                            onValueChange={(value) => setProfileData({ ...profileData, gender: value as GenderOption })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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

                      <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isLoading} className="w-full md:w-auto">
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div> 
                    </form>
                  </div>
                </div>
          </div>
        </main>
      </div>
    </div>
  )
}
