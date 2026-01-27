"use client"

import React from "react"
import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { ChevronLeft } from "lucide-react"
import { useTheme } from "next-themes"

export default function SwitchAppearancePage() {
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = typeof resolvedTheme === "string" ? resolvedTheme === "dark" : false

  const toggle = (val?: boolean) => {
    const next = typeof val === "boolean" ? val : !isDark
    setTheme(next ? "dark" : "light")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <main className="flex-1">
          {/* Fixed header (mobile only) */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border lg:hidden">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-background hover:bg-muted/50"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <h1 className="flex-1 text-center font-semibold">Switch appearance</h1>
              <div className="w-8" />
            </div>
          </div>

          <div className="pt-16 lg:pt-8 pb-24">
            <div className="max-w-4xl mx-auto px-4">
              <section className="rounded-md overflow-hidden bg-card divide-y divide-border shadow-sm">
                <div className="px-4 py-2 text-muted-foreground text-xs">Switch appearance</div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <div className="font-medium">Dark mode</div>
                    <div className="text-sm text-muted-foreground">Enable dark appearance across the app</div>
                  </div>
                  <Switch checked={isDark} onCheckedChange={(v) => toggle(v as boolean)} />
                </div>
              </section>
            </div>
          </div>

          {/* Bottom navigation (mobile only) */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 lg:hidden">
            <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
              <button className="flex-1 text-center">
                <svg className="w-6 h-6 text-muted-foreground mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V12H9v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z"/></svg>
              </button>
              <button className="flex-1 text-center">
                <svg className="w-6 h-6 text-muted-foreground mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="flex-1 text-center">
                <svg className="w-6 h-6 text-muted-foreground mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="flex-1 text-center">
                <svg className="w-6 h-6 text-muted-foreground mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="flex-1 text-center">
                <div className="w-6 h-6 rounded-full bg-muted/30 mx-auto" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
