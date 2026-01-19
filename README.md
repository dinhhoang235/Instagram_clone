# Instagram Clone

A full-stack Instagram clone with real-time messaging, notifications, posts, stories, and social features.

## ✨ Features

- User authentication (JWT) with profile management
- Posts with images, comments, likes, and hashtag support
- Follow/unfollow, user search, and discovery
- Real-time chat and notifications (WebSocket)
- Privacy settings (private/public accounts, comment/message permissions)
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

**Auth**: `POST /api/register/`, `POST /api/token/`, `POST /api/token/refresh/`
**Core**: `GET/POST /api/posts/`, `GET /api/users/{id}/`, `POST /api/posts/{id}/like/`
**Chat**: `GET /api/chats/`, `POST /api/chats/{id}/messages/`
**WebSocket**: `ws://localhost/ws/chat/{thread_id}/`, `ws://localhost/ws/notifications/{user_id}/`

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

**View logs**:
```bash
docker compose logs backend
docker compose logs frontend
```