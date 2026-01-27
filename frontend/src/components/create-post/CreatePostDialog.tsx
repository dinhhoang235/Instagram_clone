"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, X, ChevronLeft, ChevronDown, ChevronRight, MapPin, UserPlus, Smile } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import useIsDark from "@/lib/hooks/useIsDark"
import Cropper from "react-easy-crop"
import { getCroppedImg, readFileAsDataUrl } from "./utils"
import { createPost } from "@/lib/services/posts"
import { toast } from "sonner"
import Image from "next/image"
import * as DialogPrimitive from "@radix-ui/react-dialog"

type UploadItem = {
  id: string
  file: File
  dataUrl: string
  croppedFile?: File
  previewUrl?: string
}

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [step, setStep] = useState<'select' | 'crop' | 'caption'>('select')
  const [files, setFiles] = useState<UploadItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const galleryRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef<HTMLDivElement | null>(null)
  const aspectRef = useRef<HTMLDivElement | null>(null)
  const previewUrlsRef = useRef<Set<string>>(new Set())

  // crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x:number; y:number; width:number; height:number } | null>(null)

  // caption / location
  const [captionText, setCaptionText] = useState("")
  const [locationText, setLocationText] = useState("")
  const [collaboratorsText, setCollaboratorsText] = useState("")
  const [showAspectMenu, setShowAspectMenu] = useState(false)
  const [showZoomSlider, setShowZoomSlider] = useState(false)
  const [showGallery, setShowGallery] = useState(false)

  // Accessibility & advanced settings
  const [showAccessibility, setShowAccessibility] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [altTexts, setAltTexts] = useState<Record<string, string>>({})
  const [hideLikes, setHideLikes] = useState(false)
  const [disableComments, setDisableComments] = useState(false)

  // emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement | null>(null)
  
  const isDark = useIsDark()
  const categoryNavVar = '--epr-category-navigation-button-size'

  // discard confirmation
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const hasUnsavedChanges = () => {
    if (files.length > 0) return true
    if (captionText.trim() !== '') return true
    if (locationText.trim() !== '') return true
    if (collaboratorsText.trim() !== '') return true
    if (Object.values(altTexts).some(Boolean)) return true
    if (hideLikes || disableComments) return true
    return false
  }

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) {
      if (hasUnsavedChanges()) {
        setShowDiscardConfirm(true)
        return
      }
      onOpenChange(false)
    } else {
      onOpenChange(true)
    }
  }

  useEffect(() => {
    if (!open) setShowDiscardConfirm(false)
  }, [open])

  const handleEmojiClick = (data: EmojiClickData) => {
    const emoji = data.emoji
    setCaptionText((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  // close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (showGallery && galleryRef.current && !galleryRef.current.contains(target)) {
        setShowGallery(false)
      }
      if (showZoomSlider && zoomRef.current && !zoomRef.current.contains(target)) {
        setShowZoomSlider(false)
      }
      if (showAspectMenu && aspectRef.current && !aspectRef.current.contains(target)) {
        setShowAspectMenu(false)
      }
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showGallery, showZoomSlider, showAspectMenu, showEmojiPicker])

  useEffect(() => {
    if (!open) {
      // revoke any lingering preview urls stored in the ref
      const current = previewUrlsRef.current
      current.forEach((url) => { try { URL.revokeObjectURL(url) } catch {} })
      current.clear()
      setStep('select')
      setFiles([])
      setCurrentIndex(0)
      setCaptionText('')
      setLocationText('')
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setAspect(1)
      setCroppedAreaPixels(null)
      setShowAspectMenu(false)
      setShowZoomSlider(false)
      setShowGallery(false)
      setShowAccessibility(false)
      setShowAdvanced(false)
      setAltTexts({})
      setHideLikes(false)
      setDisableComments(false)
    }
  }, [open])

  // keep alt texts in sync with files
  useEffect(() => {
    setAltTexts((prev) => {
      const next: Record<string,string> = {}
      files.forEach((f) => { next[f.id] = prev[f.id] || '' })
      return next
    })
  }, [files])

  // revoke any leftover preview urls on unmount
  useEffect(() => {
    const current = previewUrlsRef.current
    return () => {
      current.forEach((url) => {
        try { URL.revokeObjectURL(url) } catch {}
      })
      current.clear()
    }
  }, [])

  const handleFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    const arr = Array.from(selectedFiles)
    const items: UploadItem[] = await Promise.all(arr.map(async (file) => {
      const dataUrl = await readFileAsDataUrl(file)
      const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
      return { id, file, dataUrl }
    }))
    setFiles((v) => [...v, ...items])
    setStep('crop')
    setCurrentIndex(files.length)
  }

  const onCropComplete = useCallback((_: { x:number; y:number }, croppedAreaPixelsLocal: { x:number; y:number; width:number; height:number }) => {
    setCroppedAreaPixels(croppedAreaPixelsLocal)
  }, [])

  const applyCropForCurrent = async () => {
    const item = files[currentIndex]
    if (!item || !croppedAreaPixels) return
    try {
      const blob = await getCroppedImg(item.dataUrl, croppedAreaPixels)
      const croppedFile = new File([blob], item.file.name, { type: blob.type })

      // revoke previous preview if present
      if (item.previewUrl) {
        try { URL.revokeObjectURL(item.previewUrl) } catch {}
        previewUrlsRef.current.delete(item.previewUrl)
      }

      const previewUrl = URL.createObjectURL(croppedFile)
      previewUrlsRef.current.add(previewUrl)

      const newFiles = [...files]
      newFiles[currentIndex] = { ...item, croppedFile, previewUrl }
      setFiles(newFiles)
    } catch (err) {
      console.error(err)
      toast.error('Crop failed')
    }
  }

  const removeFile = (id: string) => {
    const removed = files.find(f => f.id === id)
    if (removed?.previewUrl) {
      try { URL.revokeObjectURL(removed.previewUrl) } catch {}
      previewUrlsRef.current.delete(removed.previewUrl)
    }

    const newFiles = files.filter(f => f.id !== id)
    setFiles(newFiles)
    if (currentIndex >= newFiles.length) {
      setCurrentIndex(Math.max(0, newFiles.length - 1))
    }
    if (newFiles.length === 0) {
      setStep('select')
    }
  }


  const handleNext = async () => {
    if (step === 'select') {
      if (files.length === 0) return toast.error('Choose at least one photo')
      setStep('crop')
    } else if (step === 'crop') {
      if (croppedAreaPixels) await applyCropForCurrent()
      setStep('caption')
    }
  }

  const handleBack = () => {
    if (step === 'caption') {
      setStep('crop')
    } else if (step === 'crop') {
      setStep('select')
    }
  }

  const handleShare = async () => {
    if (files.length === 0) return toast.error('No files to upload')

    const fd = new FormData()
    files.forEach((f) => {
      fd.append('image', f.croppedFile || f.file)
    })
    fd.append('caption', captionText)
    fd.append('location', locationText)

    try {
      await createPost(fd)
      toast.success('Posted')
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to create post')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/70 backdrop-blur-sm" />
        <input
          id="create-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {/* Close button outside modal */}
        <button
          onClick={() => handleDialogOpenChange(false)}
          className="fixed top-4 right-4 z-[100] text-foreground hover:opacity-70 transition-opacity"
          aria-label="Close"
        >
          <X className="w-8 h-8" strokeWidth={1.5} />
        </button>

        {/* Discard confirmation modal (Radix Dialog for proper focus/interaction) */}
        <Dialog open={showDiscardConfirm} onOpenChange={(v) => setShowDiscardConfirm(v)}>
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 bg-black/50 z-[70]" />
            <DialogPrimitive.Content className="fixed z-[80] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] rounded-xl bg-background border border-border p-6 text-center">
              <VisuallyHidden.Root asChild>
                <DialogTitle>Discard post</DialogTitle>
              </VisuallyHidden.Root>
              <h3 className="text-lg font-semibold text-foreground mb-2">Discard post?</h3>

              <DialogPrimitive.Description asChild>
                <p className="text-sm text-muted-foreground mb-6">If you leave, your edits won&apos;t be saved.</p>
              </DialogPrimitive.Description>

              <div className="flex flex-col">
                <button
                  className="text-red-500 font-semibold py-3 border-t border-border"
                  onClick={() => { setShowDiscardConfirm(false); onOpenChange(false) }}
                >
                  Discard
                </button>

                <button
                  className="py-3"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>

        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] focus:outline-none">
          {/* Accessible dialog title (visually hidden for this layout) */}
          <VisuallyHidden.Root asChild>
            <DialogTitle>Create new post</DialogTitle>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <DialogPrimitive.Description>Create new post dialog. Steps: select images, crop, caption.</DialogPrimitive.Description>
          </VisuallyHidden.Root>
          <div className="w-screen h-screen max-w-5xl max-h-[90vh] flex flex-col bg-background rounded-xl overflow-hidden">
            {/* Header */}
            <div className="relative bg-background text-foreground px-4 h-12 border-b border-border">
              {/* Left */}
              <div className="absolute left-4 inset-y-0 flex items-center">
                {step !== 'select' && (
                  <button
                    className="text-foreground hover:opacity-70 transition-opacity"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Center */}
              <h3 className="absolute left-1/2 -translate-x-1/2 inset-y-0 flex items-center text-base font-semibold">
                {step === 'select'
                  ? 'Create new post'
                  : step === 'crop'
                  ? 'Crop'
                  : 'Create new post'}
              </h3>

              {/* Right */}
              <div className="absolute right-4 inset-y-0 flex items-center gap-2">
                {step === 'crop' && files.length > 0 && (
                  <button
                    className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                )}
                {step === '' && (
                  <button
                    className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                    onClick={handleShare}
                  >
                    Share
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Main area */}
              <div className="flex-1 flex items-center justify-center bg-background">
                {step === 'select' && (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <ImageIcon className="w-24 h-24 mb-6 text-muted-foreground opacity-80" strokeWidth={1} />
                    <h3 className="text-xl font-light text-foreground mb-2">Drag photos and videos here</h3>
                    
                    <Button
                      type="button"
                      onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 cursor-pointer"
                    >
                      Select from computer
                    </Button> 
                  </div>
                )}

                {step === 'crop' && files.length > 0 && (
                  <div className="relative w-full h-full">
                    <Cropper
                      image={files[currentIndex].dataUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={aspect === 0 ? undefined : aspect}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />



                    {/* Gallery panel */}
                    {showGallery && files.length > 0 && (
                      <div ref={galleryRef} className="absolute bottom-20 right-6">
                        <div className="relative">
                          {/* Tooltip */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -top-12 right-0 bg-muted/80 text-foreground text-xs px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer"
                            aria-label="Add more photos"
                          >
                            Click and drag to reorder
                          </button>
                          
                          {/* Gallery grid */}
                          <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-3 flex flex-wrap gap-2 max-w-[200px] shadow-xl">
                            {files.map((file, idx) => (
                              <div key={file.id} className="relative group">
                                <button
                                  onClick={() => setCurrentIndex(idx)}
                                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                    currentIndex === idx ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <Image src={file.dataUrl} alt="" fill className="object-cover" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeFile(file.id)
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
                                >
                                  <X className="w-4 h-4 text-foreground" />
                                </button>
                              </div>
                            ))}
                            
                            {/* Add more button */}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-20 h-20 rounded-lg border-2 border-dashed border-white/40 hover:border-white/60 flex items-center justify-center transition-colors bg-white/5"
                            >
                              <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom controls */}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                      {/* Left controls */}
                      <div className="flex items-center gap-3">
                        {/* Aspect ratio button */}
                        <div className="relative" ref={aspectRef}>
                          <button 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-foreground transition-colors ${
                              showAspectMenu ? 'bg-white/20' : 'bg-muted/60 hover:bg-muted/80'
                            }`}
                            onClick={() => {
                              setShowAspectMenu(!showAspectMenu)
                              setShowZoomSlider(false)
                              setShowGallery(false)
                            }}
                          >
                            <svg
                              aria-label="Select crop"
                              fill="currentColor"
                              height="20"
                              width="20"
                              viewBox="0 0 24 24"
                              role="img"
                            >
                              <path d="M10 20H4v-6a1 1 0 0 0-2 0v7a1 1 0 0 0 1 1h7a1 1 0 0 0 0-2ZM20.999 2H14a1 1 0 0 0 0 2h5.999v6a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1Z" />
                            </svg>

                          </button>

                          {/* Aspect ratio dropdown */}
                          {showAspectMenu && (
                            <div className="absolute bottom-full mb-3 left-0 bg-background/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden w-[160px]">
                              <button
                                className={`w-full px-4 py-3 text-left text-sm hover:bg-muted/10 transition-colors flex items-center gap-3 ${
                                  aspect === 0 ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                                onClick={() => { setAspect(0); setShowAspectMenu(false) }}
                              >
                                <svg
                                  aria-label="Photo outline icon"
                                  fill="currentColor"
                                  height="24"
                                  width="24"
                                  viewBox="0 0 24 24"
                                  role="img"
                                >
                                  {/* chấm tròn góc trái */}
                                  <path
                                    d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z"
                                    fillRule="evenodd"
                                  />

                                  {/* núi */}
                                  <path
                                    d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                  />

                                  {/* khung ảnh */}
                                  <path
                                    d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                  />
                                </svg>

                                <span>Original</span>
                                {aspect === 0 && (
                                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <button
                                className={`w-full px-4 py-3 text-left text-sm hover:bg-muted/10 transition-colors flex items-center gap-3 ${
                                  aspect === 1 ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                                onClick={() => { setAspect(1); setShowAspectMenu(false) }}
                              >
                                <svg
                                  aria-label="Crop square icon"
                                  fill="currentColor"
                                  height="24"
                                  width="24"
                                  viewBox="0 0 24 24"
                                  role="img"
                                >
                                  <path d="M19 23H5a4.004 4.004 0 0 1-4-4V5a4.004 4.004 0 0 1 4-4h14a4.004 4.004 0 0 1 4 4v14a4.004 4.004 0 0 1-4 4ZM5 3a2.002 2.002 0 0 0-2 2v14a2.002 2.002 0 0 0 2 2h14a2.002 2.002 0 0 0 2-2V5a2.002 2.002 0 0 0-2-2Z" />
                                </svg>
                                <span>1:1</span>
                                {aspect === 1 && (
                                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <button
                                className={`w-full px-4 py-3 text-left text-sm hover:bg-muted/10 transition-colors flex items-center gap-3 ${
                                  aspect === 4/5 ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                                onClick={() => { setAspect(4/5); setShowAspectMenu(false) }}
                              >
                                <svg
                                  aria-label="Crop portrait icon"
                                  fill="currentColor"
                                  height="24"
                                  width="24"
                                  viewBox="0 0 24 24"
                                  role="img"
                                >
                                  <path d="M16 23H8a4.004 4.004 0 0 1-4-4V5a4.004 4.004 0 0 1 4-4h8a4.004 4.004 0 0 1 4 4v14a4.004 4.004 0 0 1-4 4ZM8 3a2.002 2.002 0 0 0-2 2v14a2.002 2.002 0 0 0 2 2h8a2.002 2.002 0 0 0 2-2V5a2.002 2.002 0 0 0-2-2Z" />
                                </svg>
                                <span>4:5</span>
                                {aspect === 4/5 && (
                                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <button
                                className={`w-full px-4 py-3 text-left text-sm hover:bg-muted/10 transition-colors flex items-center gap-3 ${
                                  aspect === 16/9 ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                                onClick={() => { setAspect(16/9); setShowAspectMenu(false) }}
                              >
                                <svg
                                  aria-label="Crop landscape icon"
                                  fill="currentColor"
                                  height="24"
                                  width="24"
                                  viewBox="0 0 24 24"
                                  role="img"
                                >
                                  <path d="M19 20H5a4.004 4.004 0 0 1-4-4V8a4.004 4.004 0 0 1 4-4h14a4.004 4.004 0 0 1 4 4v8a4.004 4.004 0 0 1-4 4ZM5 6a2.002 2.002 0 0 0-2 2v8a2.002 2.002 0 0 0 2 2h14a2.002 2.002 0 0 0 2-2V8a2.002 2.002 0 0 0-2-2Z" />
                                </svg>

                                <span>16:9</span>
                                {aspect === 16/9 && (
                                  <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Zoom button */}
                        <div className="relative" ref={zoomRef}>
                          <button 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-foreground transition-colors ${showZoomSlider ? 'bg-white/20' : 'bg-muted/60 hover:bg-muted/80'}`}
                            onClick={() => {
                              setShowZoomSlider(!showZoomSlider)
                              setShowAspectMenu(false)
                              setShowGallery(false)
                            }}
                            aria-expanded={showZoomSlider}
                            aria-controls="zoom-slider"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="11" cy="11" r="8" strokeWidth={2} />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
                            </svg>
                          </button>

                          {showZoomSlider && (
                            <div
                              id="zoom-slider"
                              className="absolute bottom-full mb-3 left-0"
                            >
                              <div className="bg-muted/70 backdrop-blur-md rounded-full px-4 h-10 flex items-center shadow-2xl w-32">
                                <input
                                  type="range"
                                  min={1}
                                  max={3}
                                  step={0.01}
                                  value={zoom}
                                  onChange={(e) => setZoom(Number(e.target.value))}
                                  className="
                                    h-6
                                    w-full
                                    my-auto
                                    appearance-none
                                    bg-transparent
                                    cursor-pointer

                                    [&::-webkit-slider-runnable-track]:h-1
                                    [&::-webkit-slider-runnable-track]:rounded-full
                                    [&::-webkit-slider-runnable-track]:bg-white/40

                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-4
                                    [&::-webkit-slider-thumb]:h-4
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:bg-white
                                    [&::-webkit-slider-thumb]:shadow-md
                                    [&::-webkit-slider-thumb]:-mt-1.5
                                  "
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right controls - Multiple images */}
                      <button 
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-foreground transition-colors ${
                          showGallery ? 'bg-white/20' : 'bg-muted/60 hover:bg-muted/80'
                        }`}
                        onClick={() => {
                          setShowGallery(!showGallery)
                          setShowAspectMenu(false)
                          setShowZoomSlider(false)
                        }}
                      >
                        <svg
                          aria-label="Open media gallery"
                          fill="currentColor"
                          height="20"
                          width="20"
                          viewBox="0 0 24 24"
                          role="img"
                        >
                          <path
                            d="M19 15V5a4.004 4.004 0 0 0-4-4H5a4.004 4.004 0 0 0-4 4v10a4.004 4.004 0 0 0 4 4h10a4.004 4.004 0 0 0 4-4ZM3 15V5a2.002 2.002 0 0 1 2-2h10a2.002 2.002 0 0 1 2 2v10a2.002 2.002 0 0 1-2 2H5a2.002 2.002 0 0 1-2-2Zm18.862-8.773A.501.501 0 0 0 21 6.57v8.431a6 6 0 0 1-6 6H6.58a.504.504 0 0 0-.35.863A3.944 3.944 0 0 0 9 23h6a8 8 0 0 0 8-8V9a3.95 3.95 0 0 0-1.138-2.773Z"
                            fillRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {step === 'caption' && files.length > 0 && (
                  <div className="w-full h-full relative">
                    <Image 
                      src={files[currentIndex].previewUrl || files[currentIndex].dataUrl}
                      alt="preview" 
                      fill 
                      className="object-contain" 
                    />
                    
                    {/* Navigation buttons for multiple images */}
                    {files.length > 1 && (
                      <>
                        {currentIndex > 0 && (
                          <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted/60 hover:bg-muted/80 rounded-full flex items-center justify-center text-foreground transition-colors"
                            onClick={() => setCurrentIndex(currentIndex - 1)}
                            aria-label="Previous photo"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                        )}

                        {currentIndex < files.length - 1 && (
                          <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-muted/60 hover:bg-muted/80 rounded-full flex items-center justify-center text-foreground transition-colors"
                            onClick={() => setCurrentIndex(currentIndex + 1)}
                            aria-label="Next photo"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        )}

                        {/* Pagination dots for multiple images */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                          {files.map((f, idx) => (
                            <span
                              key={f.id}
                              aria-hidden="true"
                              className={`w-1.5 h-1.5 rounded-full transition-colors ${currentIndex === idx ? 'bg-blue-500' : 'bg-muted/40'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right sidebar for caption step */}
              {step === 'caption' && (
                <div className="w-[340px] bg-background border-l border-border flex flex-col">
                  <div className="p-4 flex items-center gap-3 border-b border-border">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-background" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">dinhhoang235</span>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <Textarea 
                      placeholder="Write a caption..." 
                      value={captionText} 
                      onChange={(e) => setCaptionText(e.target.value)}
                      className="w-full min-h-[180px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground resize-none p-4 ring-0 focus:ring-0 focus-visible:ring-0 ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0"
                    />
                    
                    <div className="px-4 pb-3 flex items-center justify-between border-b border-border relative">
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        aria-expanded={showEmojiPicker}
                        aria-label="Toggle emoji picker"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      {showEmojiPicker && (
                        <div 
                          ref={emojiPickerRef}
                          className="absolute top-12 left-0 z-50"
                        >
                          <EmojiPicker
                            theme={isDark ? 'dark' : 'light'}
                            onEmojiClick={handleEmojiClick}
                            width={265}
                            height={160}
                            searchDisabled={true}
                            previewConfig={{ showPreview: false }}
                            categories={[]}
                            style={{ [categoryNavVar]: '0px' } as React.CSSProperties}
                          />

                          <style jsx global>{`
                            .EmojiPickerReact .epr-category-nav {
                              display: none !important;
                              height: 0 !important;
                              padding: 0 !important;
                              margin: 0 !important;
                            }
                          `}</style>
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground">{captionText.length}/2,200</span>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors">
                          <input
                            type="text"
                            placeholder="Add location"
                            value={locationText}
                            onChange={(e) => setLocationText(e.target.value)}
                            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
                          />
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors">
                          <input
                            type="text"
                            placeholder="Add collaborators"
                            value={collaboratorsText}
                            onChange={(e) => setCollaboratorsText(e.target.value)}
                            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
                          />
                          <UserPlus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>

                      <div>
                        <div
                          className="flex items-center justify-between py-2 rounded-lg px-2 cursor-pointer transition-colors"
                          onClick={() => setShowAccessibility(!showAccessibility)}
                          aria-expanded={showAccessibility}
                        >
                          <span className={`text-base ${showAccessibility ? 'font-semibold' : 'font-normal'} text-foreground`}>Accessibility</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAccessibility ? 'rotate-180' : ''}`} />
                        </div>

                        {showAccessibility && (
                          <div className="pl-3 pt-3 pb-2 space-y-3">
                            <p className="text-xs text-muted-foreground">Alt text describes your photos for people with visual impairments. Alt text will be automatically created for your photos or you can choose to write your own.</p>

                            {files.map((f) => (
                              <div key={f.id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded overflow-hidden relative">
                                  <Image src={f.dataUrl} alt="thumb" fill className="object-cover" />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Write alt text..."
                                  value={altTexts[f.id] || ''}
                                  onChange={(e) => setAltTexts(prev => ({ ...prev, [f.id]: e.target.value }))}
                                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div
                          className="flex items-center justify-between py-2 rounded-lg px-2 cursor-pointer transition-colors"
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          aria-expanded={showAdvanced}
                        >
                          <span className={`text-base ${showAdvanced ? 'font-semibold' : 'font-normal'} text-foreground`}>Advanced settings</span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                        </div>

                        {showAdvanced && (
                          <div className="pl-3 pt-3 pb-2 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="pr-3">
                                <div className="text-sm text-foreground">Hide like and view counts on this post</div>
                                <div className="text-xs text-muted-foreground">Only you will see the total number of likes and views on this post. You can change this later.</div>
                              </div>
                              <Switch checked={hideLikes} onCheckedChange={(v) => setHideLikes(v as boolean)} aria-label="Hide like and view counts" />
                            </div>

                            <div className="flex items-start justify-between">
                              <div className="pr-3">
                                <div className="text-sm text-foreground">Turn off commenting</div>
                                <div className="text-xs text-muted-foreground">You can change this later.</div>
                              </div>
                              <Switch checked={disableComments} onCheckedChange={(v) => setDisableComments(v as boolean)} aria-label="Turn off commenting" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

export { CreatePostDialog }