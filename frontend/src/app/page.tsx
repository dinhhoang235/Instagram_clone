"use client"

import { useEffect } from "react"
import { Feed } from "@/components/feed"
// import { Stories } from "@/components/stories"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 max-w-6xl mx-auto px-4 py-8">
          {/* <Stories /> */}
          <Feed />
        </main>
      </div>
    </div>
  )
}
