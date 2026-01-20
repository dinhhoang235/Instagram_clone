'"use client"'
import { useEffect, useState } from "react"
import { Post } from "@/components/post"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SuggestedUsers } from "@/components/suggested-users"
import { PostType } from "@/types/post"
import { getPosts } from "@/lib/services/posts"
import { getMyProfile } from "@/lib/services/profile"


export function Feed() {

  const [posts, setPosts] = useState<PostType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts(1)
        setPosts(data.results)
        setHasMore(data.next !== null)
        setPage(1)
        console.log("Posts loaded:", data)
      } catch (error) {
        console.error("Failed to load posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleLoadMore = async () => {
    if (isFetchingMore || !hasMore) return

    setIsFetchingMore(true)
    try {
      const nextPage = page + 1
      const data = await getPosts(nextPage)
      setPosts((prev) => [...prev, ...data.results])
      setHasMore(data.next !== null)
      setPage(nextPage)
    } catch (error) {
      console.error("Failed to load more posts:", error)
    } finally {
      setIsFetchingMore(false)
    }
  }

  const [user, setUser] = useState<null | {
    username: string
    full_name?: string
    avatar?: string
  }>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getMyProfile()
        setUser({
          username: profile.username,
          full_name: profile.full_name,
          avatar: profile.avatar,
        })
      } catch (err) {
        console.error("Lỗi lấy profile:", err)
      }
    }

    fetchProfile()
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
          <>
            {posts.map((post) => <Post key={post.id} post={post} />)}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center py-6">
                <Button
                  variant="ghost"
                  onClick={handleLoadMore}
                  disabled={isFetchingMore}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {isFetchingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-500"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    "Load more posts"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar with Suggestions */}
      <div className="hidden xl:block w-80">
        <div className="sticky top-8 space-y-6">
          {/* User Profile Card */}
          <div className="flex items-center space-x-3 p-4">
            {/* Avatar with gradient border */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-t p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <Avatar className="w-full h-full">
                  <AvatarImage src={user.avatar || "/placeholder-user.jpg"} alt={user.username} />
                  <AvatarFallback>{user.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* User info */}
            <div className="flex-1">
              <p className="font-semibold text-sm">{user.username}</p>
              <p className="text-muted-foreground text-sm">{user.full_name}</p>
            </div>

            {/* Switch button */}
            <button className="text-blue-500 font-semibold text-xs">Switch</button>
          </div>

          {/* Suggested Users */}
          <SuggestedUsers variant="sidebar" limit={5} />

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
