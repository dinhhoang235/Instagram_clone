"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { redirect } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Globe, Users, Lock, ChevronLeft } from "lucide-react"
import type { AllowOption, UpdateProfileInput } from "@/types/profile"
import { getMyProfile, updateMyProfile } from "@/lib/services/profile"

export default function PrivacyPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    redirect("/login")
  }

  const [isLoading, setIsLoading] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    isPrivate: false,
    allowTagging: true,
    showActivity: true,
    allowStoryResharing: true,
    allowComments: "everyone" as AllowOption,
    allowMessages: "everyone" as AllowOption,
  })

  useEffect(() => {
    async function fetchProfile() {
      const profile = await getMyProfile()
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

  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload: UpdateProfileInput = {
        is_private: privacySettings.isPrivate,
        allow_tagging: privacySettings.allowTagging,
        show_activity: privacySettings.showActivity,
        allow_story_resharing: privacySettings.allowStoryResharing,
        allow_comments: privacySettings.allowComments,
        allow_messages: privacySettings.allowMessages,
      }

      await updateMyProfile(payload)
      alert("Privacy settings updated")
    } catch (error) {
      console.error("Failed to update privacy settings:", error)
      alert("Failed to update privacy settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-20 lg:pt-4 lg:pb-4">
        <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border lg:hidden">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-background hover:bg-muted/50"
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-foreground">Privacy Settings</h1>
            <div className="w-8" />
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold p-6">Privacy Settings</h1>
        </div>

        <div className="rounded-md overflow-hidden bg-card shadow-sm">
          <div className="p-6">
            <form onSubmit={handlePrivacySubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium">Private Account</div>
                    <p className="text-sm text-muted-foreground">
                      When your account is private, only people you approve can see your photos and videos.
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.isPrivate}
                    onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, isPrivate: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium">Allow Tagging</div>
                    <p className="text-sm text-muted-foreground">Allow others to tag you in their posts and stories.</p>
                  </div>
                  <Switch checked={privacySettings.allowTagging} onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowTagging: checked })} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium">Activity Status</div>
                    <p className="text-sm text-muted-foreground">Allow others to see when you were last active.</p>
                  </div>
                  <Switch checked={privacySettings.showActivity} onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showActivity: checked })} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-medium">Story Resharing</div>
                    <p className="text-sm text-muted-foreground">Allow others to reshare your stories to their stories.</p>
                  </div>
                  <Switch checked={privacySettings.allowStoryResharing} onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowStoryResharing: checked })} />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="text-base font-medium">Comments</div>
                  <p className="text-sm text-muted-foreground">Control who can comment on your posts.</p>
                  <Select value={privacySettings.allowComments} onValueChange={(value) => setPrivacySettings({ ...privacySettings, allowComments: value as AllowOption })}>
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
                      <SelectItem value="no_one">
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
                  <div className="text-base font-medium">Messages</div>
                  <p className="text-sm text-muted-foreground">Control who can send you direct messages.</p>
                  <Select value={privacySettings.allowMessages} onValueChange={(value) => setPrivacySettings({ ...privacySettings, allowMessages: value as AllowOption })}>
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
                      <SelectItem value="no_one">
                        <div className="flex items-center">
                          <Lock className="w-4 h-4 mr-2" />
                          Off
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}