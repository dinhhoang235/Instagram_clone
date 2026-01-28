"use client"

import React, { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import Cropper from "react-easy-crop"
import { X, RefreshCcwDot, Crop, Maximize2, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCroppedImg } from "@/components/create-post/utils"
import { getMyProfile } from "@/lib/services/profile"
import { createPost } from "@/lib/services/posts"
import type { ProfileType } from "@/types/profile"

export default function CreatePage() {
  const router = useRouter()
  const [step, setStep] = useState<'style' | 'details'>('style')

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const objectUrlRef = useRef<string | undefined>(undefined)

  // track original image + crop state when user applies a crop so we can restore on Back
  const [preCropImage, setPreCropImage] = useState<string | null>(null)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)
  const preCropStateRef = useRef<{
    crop: { x: number; y: number }
    zoom: number
    rotation: number
    croppedAreaPixels?: { x: number; y: number; width: number; height: number }
  } | null>(null)

  // details state
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const [showAccessibility, setShowAccessibility] = useState(false)
  const [altText, setAltText] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hideLikeCount, setHideLikeCount] = useState(false)
  const [turnOffComments, setTurnOffComments] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [profileUrl, setProfileUrl] = useState<string | null>(null)

  useEffect(() => {
    // Try to reuse blob URL previously set by mobile picker / other workflows
    const blob = sessionStorage.getItem('createImage')
    if (blob) {
      setImageSrc(blob)
      objectUrlRef.current = blob
    }

    // If URL contains ?step=details and we have an image, start on details
    try {
      const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      if (qs?.get('step') === 'details' && blob) setStep('details')
    } catch { }

    // fetch profile for header
    getMyProfile()
      .then((p: ProfileType | null) => {
        if (p) {
          if (p.avatar) setProfileUrl(p.avatar)
        }
      })
      .catch(() => { })

    return () => {
      // don't revoke here; we keep blob URL until user cancels or shares
    }
  }, [])

  const onFileSelected = (file: File | null) => {
    if (!file) return
    try {
      const url = URL.createObjectURL(file)
      // lazy import to avoid circulars
      import('@/lib/createImageStore').then(({ setFileForUrl }) => setFileForUrl(url, file))
      sessionStorage.setItem('createImage', url)
      sessionStorage.removeItem('createImageId')
      setImageSrc(url)
      objectUrlRef.current = url
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0]
    onFileSelected(f ?? null)
  }

  const applyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      // save the current image and crop state so we can restore it if user goes to details and then back
      setPreCropImage(imageSrc)
      preCropStateRef.current = { crop, zoom, rotation, croppedAreaPixels }

      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      const file = new File([blob], 'photo.jpg', { type: blob.type })
      const newUrl = URL.createObjectURL(file)

      const { setFileForUrl, removeFileForUrl } = await import('@/lib/createImageStore')
      // remove previous generated cropped image if any (we keep the original pre-crop image intact)
      if (croppedImageUrl && croppedImageUrl !== newUrl) {
        try { removeFileForUrl(croppedImageUrl) } catch { }
        try { URL.revokeObjectURL(croppedImageUrl) } catch { }
      }

      setFileForUrl(newUrl, file)
      sessionStorage.setItem('createImage', newUrl)
      setImageSrc(newUrl)
      objectUrlRef.current = newUrl
      setCroppedImageUrl(newUrl)

      // reset crop state (for the new image)
      setZoom(1)
      setRotation(0)
      setCrop({ x: 0, y: 0 })
    } catch (err) {
      console.error('Failed to apply crop:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  function dataURLtoFile(dataurl: string, filename = 'upload.jpg') {
    const arr = dataurl.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
  }

  const handleShare = async () => {
    if (!imageSrc) return
    setIsSubmitting(true)
    try {
      let file: File
      if (imageSrc.startsWith('blob:')) {
        const { getFileForUrl } = await import('@/lib/createImageStore')
        const f = getFileForUrl(imageSrc)
        if (!f) {
          console.error('File not found in in-memory store for', imageSrc)
          // Inform user to reselect image — cannot recover blob created in another document
          // without server-side temp upload or IndexedDB persistence.
          alert('Selected image is no longer available. Please re-select the image.')
          router.replace('/create')
          return
        }
        file = f
      } else if (imageSrc.startsWith('data:')) {
        file = dataURLtoFile(imageSrc)
      } else {
        const resp = await fetch(imageSrc)
        const blob = await resp.blob()
        file = new File([blob], 'photo.jpg', { type: blob.type })
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('caption', caption)
      if (location) formData.append('location', location)
      if (altText) formData.append('alt_text', altText)
      formData.append('hide_like_count', String(hideLikeCount))
      formData.append('turn_off_comments', String(turnOffComments))

      await createPost(formData)

      // cleanup: remove any blobs we created (current + pre-crop/cropped)
      const { removeFileForUrl } = await import('@/lib/createImageStore')
      const val = sessionStorage.getItem('createImage')
      if (val && val.startsWith('blob:')) {
        try { removeFileForUrl(val) } catch { }
        try { URL.revokeObjectURL(val) } catch { }
      }
      if (preCropImage && preCropImage.startsWith('blob:') && preCropImage !== val) {
        try { removeFileForUrl(preCropImage) } catch { }
        try { URL.revokeObjectURL(preCropImage) } catch { }
      }
      if (croppedImageUrl && croppedImageUrl.startsWith('blob:') && croppedImageUrl !== val && croppedImageUrl !== preCropImage) {
        try { removeFileForUrl(croppedImageUrl) } catch { }
        try { URL.revokeObjectURL(croppedImageUrl) } catch { }
      }

      sessionStorage.removeItem('createImage')
      sessionStorage.removeItem('createImageId')
      setPreCropImage(null)
      setCroppedImageUrl(null)
      preCropStateRef.current = null

      router.push('/')
    } catch (err) {
      console.error('Failed to share post:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = async () => {
    try {
      const { removeFileForUrl } = await import('@/lib/createImageStore')
      const blob = sessionStorage.getItem('createImage')
      if (blob && blob.startsWith('blob:')) {
        try { removeFileForUrl(blob) } catch { }
        try { URL.revokeObjectURL(blob) } catch { }
      }
      if (preCropImage && preCropImage.startsWith('blob:') && preCropImage !== blob) {
        try { removeFileForUrl(preCropImage) } catch { }
        try { URL.revokeObjectURL(preCropImage) } catch { }
      }
      if (croppedImageUrl && croppedImageUrl.startsWith('blob:') && croppedImageUrl !== blob && croppedImageUrl !== preCropImage) {
        try { removeFileForUrl(croppedImageUrl) } catch { }
        try { URL.revokeObjectURL(croppedImageUrl) } catch { }
      }
      // also remove any server-side temp id if exists
      sessionStorage.removeItem('createImage')
      sessionStorage.removeItem('createImageId')
      setPreCropImage(null)
      setCroppedImageUrl(null)
      preCropStateRef.current = null
    } catch (err) {
      console.error('Error clearing create image:', err)
    } finally {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          {step === 'details' ? (
            <button aria-label="Back" onClick={() => {
              // restore crop/original image if we have it saved
              setStep('style')
              try { router.replace('/create') } catch { }
              if (preCropImage) {
                setImageSrc(preCropImage)
                sessionStorage.setItem('createImage', preCropImage)
                const s = preCropStateRef.current
                if (s) {
                  setCrop(s.crop)
                  setZoom(s.zoom)
                  setRotation(s.rotation)
                  if (s.croppedAreaPixels) setCroppedAreaPixels(s.croppedAreaPixels)
                }
                // show cropper
                setIsZoomed(false)
              }
            }} className="p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <button aria-label="Close" onClick={handleClose} className="p-2">
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="font-semibold">New post</div>
          {step === 'style' ? (
            <button onClick={async () => {
              // If user hasn't applied crop but there is a crop selection, apply it first
              if (croppedAreaPixels && !isProcessing) {
                await applyCrop()
              }
              setStep('details')
              try { router.replace('/create?step=details') } catch { }
            }} className={`text-blue-500 font-medium ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`} disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Next'}</button>
          ) : (
            <button onClick={handleShare} className="text-blue-500 font-medium" disabled={isSubmitting}>{isSubmitting ? 'Sharing...' : 'Share'}</button>
          )}
        </div>
      </div>

      <main className="pt-16 pb-20">
        <div className="max-w-2xl mx-auto">

          {!imageSrc ? (
            <div className="w-full h-96 rounded-lg border border-dashed flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-lg">Select a photo</div>
                <input type="file" accept="image/*" onChange={handleInputChange} />
              </div>
            </div>
          ) : (
            <>
              {step === 'style' && (
                <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isZoomed ? (
                      <div className="relative w-full h-full flex items-center justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                        <Image src={imageSrc} alt="Selected" fill className="object-contain" />
                      </div>
                    ) : (
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        showGrid={true}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_croppedArea, pixels) => setCroppedAreaPixels(pixels)}
                      />
                    )}
                  </div>

                  <div className="absolute left-4 bottom-3 flex items-center gap-3">
                    <button
                      className="p-2 bg-black/40 rounded-full shadow-md translate-y-1"
                      aria-label={isZoomed ? 'Enter crop and zoom in' : 'Exit crop and zoom out'}
                      onClick={() => {
                        if (isZoomed) {
                          // currently in preview (zoomed-out view) — show cropper and zoom a little
                          setZoom(1.2)
                          setIsZoomed(false)
                        } else {
                          // currently in cropper — reset zoom and show preview
                          setZoom(1)
                          setIsZoomed(true)
                        }
                      }}
                    >
                      {/* Show expand icon in preview (action = enter crop), and collapse icon inside cropper */}
                      {isZoomed ? <Maximize2 className="w-5 h-5 text-white" /> : <Crop className="w-5 h-5 text-white" />}
                    </button>
                  </div>

                  <div className="absolute right-4 bottom-3 flex items-center gap-3">
                    <button className="p-2 bg-black/40 rounded-full shadow-md translate-y-1" aria-label="Rotate" onClick={() => setRotation((r) => (r + 90) % 360)}>
                      <RefreshCcwDot className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'details' ? (
                <>
                  <div className="flex items-start gap-3 py-3 border-b mb-4 px-4">
                    {/* Avatar */}
                    <Avatar className="shrink-0">
                      {profileUrl ? (
                        <AvatarImage src={profileUrl} alt="Profile" />
                      ) : (
                        <AvatarFallback className="bg-muted">U</AvatarFallback>
                      )}
                    </Avatar>

                    {/* Caption */}
                    <textarea
                      placeholder="Write a caption..."
                      className="flex-1 resize-none bg-transparent text-sm outline-none"
                      rows={2}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                    />

                    {/* Image preview */}
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-black shrink-0">
                      <Image
                        src={imageSrc}
                        alt="Selected"
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 px-4">
                    <div className="bg-card border rounded-md divide-y divide-border overflow-hidden">
                      <Input placeholder="Add location" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>

                    <div className="bg-card border rounded-md">
                      <button onClick={() => setShowAccessibility((v) => !v)} className="w-full flex items-center justify-between p-4">
                        <div className={`${showAccessibility ? 'font-semibold' : ''}`}>Accessibility</div>
                        <ChevronRight className={`w-4 h-4 transform transition-transform ${showAccessibility ? 'rotate-90' : ''}`} />
                      </button>
                      {showAccessibility && (
                        <div className="p-4 border-t">
                          <p className="text-sm text-muted-foreground mb-3">Alt text describes your photos for people with visual impairments. Alt text will be automatically created for your photos or you can choose to write your own.</p>
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 overflow-hidden rounded-md bg-black">
                              <Image src={imageSrc as string} alt="Selected" width={48} height={48} className="object-cover" />
                            </div>
                            <Textarea placeholder="Write alt text..." value={altText} onChange={(e) => setAltText(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-card border rounded-md">
                      <button onClick={() => setShowAdvanced((v) => !v)} className="w-full flex items-center justify-between p-4">
                        <div className={`${showAdvanced ? 'font-semibold' : ''}`}>Advanced settings</div>
                        <ChevronRight className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                      </button>
                      {showAdvanced && (
                        <div className="p-4 border-t space-y-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Hide like and view counts on this post</div>
                                <div className="text-sm text-muted-foreground">Only you will see the total number of likes and views on this post. You can change this later.</div>
                              </div>
                              <Switch checked={hideLikeCount} onCheckedChange={(v) => setHideLikeCount(v as boolean)} />
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Turn off commenting</div>
                                <div className="text-sm text-muted-foreground">You can change this later by going to the … menu at the top of your post.</div>
                              </div>
                              <Switch checked={turnOffComments} onCheckedChange={(v) => setTurnOffComments(v as boolean)} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}

        </div>
      </main>
    </div>
  )
}