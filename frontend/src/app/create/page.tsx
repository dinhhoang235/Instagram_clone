"use client"

import type React from "react"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, X } from "lucide-react"
import Image from "next/image"
import { createPost } from "@/lib/services/posts"
import { useRouter } from "next/navigation"


export default function CreatePage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const router = useRouter()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file) // lưu file gốc
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }


  const handleShare = async () => {
    if (!imageFile) return

    const formData = new FormData()
    formData.append("image", imageFile)
    formData.append("caption", caption)
    formData.append("location", location)

    try {
      await createPost(formData)
      // Reset form
      setImageFile(null)
      setSelectedImage(null)
      setCaption("")
      setLocation("")
      router.push("/") // hoặc feed page
    } catch (error) {
      console.error("Lỗi tạo bài viết:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Card>
              <CardHeader>
                <CardTitle>Create new post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-4">
                  <Label>Photo or video</Label>
                  {!selectedImage ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                      <div className="flex flex-col items-center justify-center text-center min-h-[300px]">
                        <ImageIcon className="w-12 h-12 mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Drag photos and videos here</h3>
                        <p className="text-muted-foreground mb-4">or</p>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex items-center justify-center cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById("image-upload")?.click();
                              }}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Select from computer
                            </Button>
                          </div>
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={selectedImage || "/placeholder.svg"}
                          alt="Selected image"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setSelectedImage(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">{caption.length}/2,200</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Advanced settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Hide like and view counts on this post</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Turn off commenting</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                  </div>
                </div>

                {/* Share Button */}
                <Button onClick={handleShare} className="w-full bg-black text-white text-xs" disabled={!selectedImage}>
                  Share
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
