import { Post } from "@/components/post"
// import { SuggestedUsers } from "@/components/suggested-users"

const posts = [
  {
    id: 1,
    user: {
      username: "john_doe",
      avatar: "/placeholder-user.jpg",
      isVerified: false,
    },
    image: "/placeholder.svg?height=600&width=600",
    caption: "Beautiful sunset at the beach! 🌅 #sunset #beach #photography",
    likes: 1234,
    comments: 89,
    timeAgo: "2 hours ago",
    location: "Malibu, California",
  },
  {
    id: 2,
    user: {
      username: "jane_smith",
      avatar: "/placeholder-user.jpg",
      isVerified: true,
    },
    image: "/placeholder.svg?height=600&width=600",
    caption: "Coffee and code ☕️💻 Starting the day right! #coding #coffee #developer",
    likes: 892,
    comments: 45,
    timeAgo: "4 hours ago",
    location: "San Francisco, CA",
  },
  {
    id: 3,
    user: {
      username: "travel_enthusiast",
      avatar: "/placeholder-user.jpg",
      isVerified: false,
    },
    image: "/placeholder.svg?height=600&width=600",
    caption:
      "Exploring the mountains today! The view is absolutely breathtaking 🏔️ #travel #mountains #adventure #hiking",
    likes: 2156,
    comments: 134,
    timeAgo: "6 hours ago",
    location: "Swiss Alps",
  },
]

export function Feed() {
  return (
    <div className="flex gap-8">
      {/* Main Feed */}
      <div className="flex-1 space-y-6">
        {posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>

      {/* Sidebar with Suggestions */}
      <div className="hidden xl:block w-80">
        <div className="sticky top-8 space-y-6">
          {/* User Profile Card */}
          <div className="flex items-center space-x-3 p-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <img
                  src="/placeholder-user.jpg"
                  alt="Your profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">john_doe</p>
              <p className="text-muted-foreground text-sm">John Doe</p>
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
