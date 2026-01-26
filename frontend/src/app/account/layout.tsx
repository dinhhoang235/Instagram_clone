"use client"

import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import AccountNav from "./AccountNav"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // When on /account/settings and on desktop, default to the Edit panel at /account/edit
    if (typeof window !== "undefined") {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches
      if (isDesktop && pathname === "/account/settings") {
        router.replace("/account/edit")
      }
    }
    // run when pathname changes
  }, [pathname, router])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <Sidebar />

        {/* main content: left nav (desktop) + detail area */}
        <div className="flex-1 lg:ml-20">
          <div className="lg:flex">
            <aside className="hidden lg:block w-80 border-r border-border px-6 py-8 sticky top-0 h-screen overflow-y-auto">
              <AccountNav />
            </aside>

            <main className="flex-1 px-4 flex justify-center">
              <div className="w-full max-w-4xl">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
