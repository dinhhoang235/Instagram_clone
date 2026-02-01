# Instagram Clone

A full-stack Instagram clone with real-time messaging, notifications, posts, stories, and social features.

## ✨ Features

- User authentication (JWT) with profile management
- Posts with images, comments, likes, hashtags, and support for image alt text
- Hide likes & disable comments per-post (privacy controls)
- Bookmarks / Saved posts (toggle & list)
- Feed (`/api/posts/feed/`) and Explore (`/api/posts/explore/`) endpoints
- Trending tags and popular places endpoints
- Follow/unfollow, remove follower, suggested users, user search, and discovery
- Real-time chat with file attachments, post-sharing into chats, mark-read and thread deletion (REST + WebSocket)
- Real-time notifications (WebSocket) for likes, comments, mentions and follows; mark-as-read & unread filtering
- Profile settings: tagging, story resharing, activity visibility, and light/dark theme
- Responsive design with dark/light mode

## 🚀 Tech Stack

**Backend**: Django 5.1.2, Django REST Framework, MySQL 8.0, Redis, Django Channels (WebSocket)
**Frontend**: Next.js 15.3.3, TypeScript, Tailwind CSS, Radix UI
**DevOps**: Docker, Docker Compose

## 📋 Installation

**Prerequisites**: Docker & Docker Compose

1. **Clone and setup**
   ```bash
   git clone https://github.com/yourusername/instagram-clone.git
   cd instagram-clone
   cp .env.example .env
   ```

2. **Configure `.env`** (see example below)

3. **Start application**
   ```bash
   docker compose up --build
   ```

4. **Access**
   - Frontend: http://localhost
   - Backend API: http://localhost/api
   - Admin: http://localhost/admin

## 🔐 Environment Variables

Create a `.env` file:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=instagram_clone
DB_USER=admin
DB_PASSWORD=admin123
DB_HOST=db
DB_PORT=3306

MYSQL_ROOT_PASSWORD=admin123
MYSQL_DATABASE=instagram_clone
MYSQL_USER=admin
MYSQL_PASSWORD=admin123

# Redis
REDIS_URL=redis://redis:6379/0

# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_WS_HOST=localhost
```

## 📡 API Endpoints

**Auth**: `POST /api/register/`, `POST /api/token/`, `POST /api/token/refresh/`, `POST /api/users/change_password/`

**Posts / Tags**:
- `GET/POST /api/posts/` — create posts (supports images + `alt_texts`, `hide_likes`, `disable_comments`)
- `POST /api/posts/{id}/like/` — like/unlike
- `POST /api/posts/{id}/save/` — toggle save/bookmark
- `GET /api/posts/saved/` — list saved posts for current user
- `GET /api/posts/feed/` — feed from people you follow
- `GET /api/posts/explore/` — explore feed
- `GET /api/posts/places/popular/` — popular places
- `GET /api/tags/trending/` — trending tags

**Users / Profiles**:
- `GET /api/users/me/` — current user
- `POST /api/register/` — register new user
- `POST /api/profile/{username}/toggle_follow/` — follow/unfollow
- `POST /api/profile/{username}/remove_follower/` — remove a follower
- `GET /api/profile/{username}/followers/` — list followers
- `GET /api/profile/{username}/following/` — list following
- `GET /api/profile/suggested/` — suggested users/discovery

**Chats**:
- `GET /api/chats/conversations/` — conversation list
- `GET /api/chats/threads/{thread_id}/messages/` — list messages in a thread
- `POST /api/chats/threads/{thread_id}/send-file/` — send a file/image in chat
- `POST /api/chats/threads/{thread_id}/share-post/` — share a post into a chat
- `POST /api/chats/threads/{thread_id}/mark-read/` — mark thread as read
- `DELETE /api/chats/threads/{thread_id}/` — delete thread
- `POST /api/chats/start/` — start a new conversation

**Notifications**:
- `GET /api/notifications/` — list notifications (`?unread=true` to filter)
- `POST /api/notifications/mark_all_as_read/`
- `POST /api/notifications/{id}/mark_as_read/`

**WebSocket (real-time)**:
- `ws://localhost/ws/chat/{thread_id}/` — chat messages & updates
- `ws://localhost/ws/notifications/` — realtime notifications

(See code for more endpoints and query params.)

## 🔧 Development

**Create superuser**:
```bash
docker compose exec backend python manage.py createsuperuser
```

**Migrations**:
```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

**Seeding fake data (development only)** ✅
Run the seeder locally (from project root):

```bash
cd backend
python manage.py seed_fake_data --users 30 --posts-per-user 3 --images-per-post 1
```

Example — full command with most flags (local):

```bash
# from project root (single-line) or run directly inside backend
cd backend && python manage.py seed_fake_data \
  --users 30 \
  --posts-per-user 3 \
  --images-per-post 2 \
  --comments-per-post 5 \
  --max-days-ago 180 \
  --verified-chance 0.08 \
  --private-chance 0.25 \
  --save-posts-chance 0.7 \
  --max-saved-per-user 30 \
  --min-image-posts-per-user 1 \
  --image-chance 0.6 \
  --clear
```

Or run inside Docker (same flags):

```bash
docker compose exec backend python manage.py seed_fake_data --users 50 --posts-per-user 4 --images-per-post 2 --comments-per-post 5 --max-days-ago 180 --verified-chance 0.08 --private-chance 0.25 --save-posts-chance 0.7 --max-saved-per-user 30 --min-image-posts-per-user 1 --image-chance 0.6 --clear
```

Useful flags:
- `--users N` (default 20) — number of fake users to create
- `--posts-per-user N` (default 3)
- `--images-per-post N` (default 1)
- `--comments-per-post N` (default 3)
- `--clear` — delete generated fake users/posts/comments/follows before seeding
- `--max-days-ago N` (default 365) — randomize post timestamps up to N days in the past
- `--min-image-posts-per-user N` (default 1) — ensure each user has at least N posts with images
- `--image-chance F` (0-1, default 0.7) — probability a non-required post will have an image
- `--verified-chance F` (0-1, default 0.05) — probability a profile is verified
- `--private-chance F` (0-1, default 0.2) — probability a profile is private
- `--save-posts-chance F` (0-1, default 0.5) — probability a user will save posts
- `--max-saved-per-user N` (default 20)

Notes:
- Generated users use password `password123` by default — only use for local/dev testing.
- Seeder downloads images from Picsum when online; falls back to generated images if offline.

**View logs**:
```bash
docker compose logs backend
docker compose logs frontend
```