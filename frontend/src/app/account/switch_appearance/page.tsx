"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Switch } from "@/components/ui/switch"
import { ChevronLeft } from "lucide-react"

export default function SwitchAppearancePage() {
  const router = useRouter()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Init from localStorage; default to light (white) if not set
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      setDark(true)
      document.documentElement.classList.add("dark")
    } else {
      // default to light
      setDark(false)
      document.documentElement.classList.remove("dark")
      if (!saved) localStorage.setItem("theme", "light")
    }
  }, [])

  const toggle = (val?: boolean) => {
    const next = typeof val === "boolean" ? val : !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <div className={"min-h-screen " + (dark ? "bg-zinc-900 text-white" : "bg-white text-foreground")}>
      <div className="flex">
        <main className="flex-1">
          {/* Fixed header (mobile only) */}
          <div className={"fixed top-0 left-0 right-0 z-40 " + (dark ? "bg-zinc-900" : "bg-white") + " border-b border-border lg:hidden"}>
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white hover:bg-slate-50"
                aria-label="Back"
              >
                <ChevronLeft className={"w-5 h-5 " + (dark ? "text-white" : "text-foreground")} />
              </button>
              <h1 className="flex-1 text-center font-semibold">Switch appearance</h1>
              <div className="w-8" />
            </div>
          </div>

          <div className="pt-16 lg:pt-8 pb-24">
            <div className="max-w-4xl mx-auto px-4">
              <section className={"rounded-md overflow-hidden shadow-sm " + (dark ? "bg-zinc-900" : "bg-white") + " divide-y divide-border"}>
                <div className="px-4 py-2 text-muted-foreground text-xs">Switch appearance</div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <div className="font-medium">Dark mode</div>
                    <div className="text-sm text-muted-foreground">Enable dark appearance across the app</div>
                  </div>
                  <Switch checked={dark} onCheckedChange={(v) => toggle(v as boolean)} />
                </div>
              </section>
            </div>
          </div>

          {/* Bottom navigation (mobile only) */}
          <div className={"fixed bottom-0 left-0 right-0 " + (dark ? "bg-zinc-900" : "bg-white") + " border-t border-border py-2 lg:hidden"}>
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
                <div className="w-6 h-6 rounded-full bg-gray-200 mx-auto" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
