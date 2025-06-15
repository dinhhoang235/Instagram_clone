'"use client"'
import { useEffect, useState } from "react"
import { Post } from "@/components/post"
// import { SuggestedUsers } from "@/components/suggested-users"
import { PostType } from "@/types/post"
import { getPosts } from "@/lib/services/posts"
import { getCurrentUser } from "@/lib/services/auth"

export function Feed() {

  const [posts, setPosts] = useState<PostType[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts()
        setPosts(data)
        console.log("Posts loaded:", data)
      } catch (error) {
        console.error("Failed to load posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const [user, setUser] = useState<null | {
    username: string
    full_name?: string
    avatar?: string
  }>(null)

  useEffect(() => {
    getCurrentUser()
      .then((userData) => setUser(userData))
      .catch((err) => console.error("Lỗi lấy user:", err))
  }, [])

  if (!user) return null

  return (
    <div className="flex gap-8">
      {/* Main Feed */}
      <div className="flex-1 space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground">No posts found</p>
        ) : (
          posts.map((post) => <Post key={post.id} post={post} />)
        )}
      </div>

      {/* Sidebar with Suggestions */}
      <div className="hidden xl:block w-80">
        <div className="sticky top-8 space-y-6">
          {/* User Profile Card */}
          <div className="flex items-center space-x-3 p-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user.username}</p>
              <p className="text-muted-foreground text-sm">{user.full_name}</p>
            </div>
            <button className="text-blue-500 font-semibold text-xs">Switch</button>
          </div>

          {/* Suggested Users */}
          {/* <SuggestedUsers variant="sidebar" limit={5} /> */}

          {/* Footer Links */}
          <div className="text-xs text-muted-foreground space-y-3 px-4">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <a href="#" className="hover:underline">
                About
              </a>
              <a href="#" className="hover:underline">
                Help
              </a>
              <a href="#" className="hover:underline">
                Press
              </a>
              <a href="#" className="hover:underline">
                API
              </a>
              <a href="#" className="hover:underline">
                Jobs
              </a>
              <a href="#" className="hover:underline">
                Privacy
              </a>
              <a href="#" className="hover:underline">
                Terms
              </a>
              <a href="#" className="hover:underline">
                Locations
              </a>
              <a href="#" className="hover:underline">
                Language
              </a>
            </div>
            <p className="text-muted-foreground/70">© 2024 INSTAGRAM FROM META</p>
          </div>
        </div>
      </div>
    </div>
  )
}
