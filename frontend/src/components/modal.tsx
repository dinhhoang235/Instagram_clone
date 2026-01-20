"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

interface ModalProps {
  children: React.ReactNode
}

export function Modal({ children }: ModalProps) {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Disable body scroll
    document.body.style.overflow = "hidden"

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.back()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
      // Re-enable body scroll
      document.body.style.overflow = "unset"
    }
  }, [router])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      router.back()
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-hidden"
    >
      <button
        onClick={() => router.back()}
        className="hidden lg:flex absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      {children}
    </div>
  )
}
