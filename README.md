# Instagram Clone

A full-stack Instagram clone built with modern web technologies, featuring real-time chat, notifications, and all the core Instagram functionalities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- **User Authentication & Authorization**
  - User registration and login with JWT tokens
  - Profile management with customizable privacy settings
  - Profile verification status

- **Posts & Media**
  - Image upload and sharing
  - Caption support with hashtag detection
  - Location tagging
  - Like/unlike functionality
  - Comments system with threaded replies
  - Automatic image resizing and optimization

- **Social Features**
  - Follow/unfollow users
  - User discovery and search
  - Hashtag search and trending
  - User mentions and tagging
  - Suggested users

- **Real-time Features**
  - Direct messaging with WebSocket support
  - Real-time notifications
  - Live chat threads
  - Message read status
  - Online status indicators

- **Privacy & Settings**
  - Private/public account settings
  - Comment permissions (everyone/followers/no one)
  - Message permissions
  - Story resharing controls
  - Activity status visibility

### Additional Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching support
- **Modern UI**: Built with Radix UI components
- **Image Optimization**: Automatic image resizing and compression
- **Real-time Updates**: WebSocket integration for instant updates

## 🚀 Tech Stack

### Backend
- **Framework**: Django 5.1.2 with Django REST Framework
- **Database**: MySQL 8.0
- **Cache/Sessions**: Redis 7
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Real-time**: Django Channels with WebSocket support
- **Image Processing**: Pillow
- **Container**: Docker

### Frontend
- **Framework**: Next.js 15.3.3 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: Day.js
- **Notifications**: Sonner
- **Container**: Docker

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **CORS**: django-cors-headers
- **Environment**: python-dotenv
- **Development**: Hot reload for both frontend and backend

## 📁 Project Structure

```
Instagram_clone/
├── backend/                    # Django backend
│   ├── backend/               # Main Django project
│   │   ├── settings.py        # Django settings
│   │   ├── urls.py           # URL routing
│   │   ├── routers.py        # API routers
│   │   └── middleware.py     # Custom middleware
│   ├── users/                # User management app
│   ├── posts/                # Posts and media app
│   ├── comments/             # Comments system
│   ├── chats/                # Real-time messaging
│   ├── notifications/        # Notification system
│   ├── search/               # Search functionality
│   ├── media/                # User uploaded files
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile           # Backend container config
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   │   ├── login/       # Authentication pages
│   │   │   ├── register/    # User registration
│   │   │   ├── profile/     # User profiles
│   │   │   ├── messages/    # Direct messaging
│   │   │   ├── create/      # Post creation
│   │   │   ├── explore/     # Discovery page
│   │   │   └── search/      # Search functionality
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── feed.tsx     # Main feed
│   │   │   ├── post.tsx     # Post component
│   │   │   ├── chat.tsx     # Chat interface
│   │   │   └── sidebar.tsx  # Navigation sidebar
│   │   ├── lib/             # Utility functions
│   │   ├── stores/          # State management
│   │   └── types/           # TypeScript types
│   ├── package.json         # Node dependencies
│   └── Dockerfile          # Frontend container config
├── docker-compose.yml       # Multi-container orchestration
└── README.md               # Project documentation
```

## 📋 Prerequisites

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Node.js** (v18+) - for local development
- **Python** (v3.10+) - for local development

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/instagram-clone.git
   cd instagram-clone
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** (see [Environment Variables](#environment-variables))

4. **Build and start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=instagram_db
MYSQL_USER=instagram_user
MYSQL_PASSWORD=instagram_password

# Database URL for Django
DATABASE_URL=mysql://instagram_user:instagram_password@db:3306/instagram_db

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_HOST=localhost:8000
```

## 🚀 Running the Application

### Using Docker Compose (Recommended)

1. **Start all services**
   ```bash
   docker-compose up
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Admin Panel: http://localhost:8000/admin

3. **Create a superuser** (optional)
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/register/` - User registration
- `POST /api/token/` - Login (obtain JWT tokens)
- `POST /api/token/refresh/` - Refresh JWT token

### Core Endpoints
- `GET /api/posts/` - List posts (feed)
- `POST /api/posts/` - Create new post
- `GET /api/users/` - List users
- `GET /api/users/{id}/` - User profile
- `POST /api/posts/{id}/like/` - Like/unlike post
- `GET /api/chats/` - Chat threads
- `POST /api/chats/{id}/messages/` - Send message
- `GET /api/search/` - Search users and content

### WebSocket Endpoints
- `ws://localhost:8000/ws/chat/{thread_id}/` - Real-time chat
- `ws://localhost:8000/ws/notifications/{user_id}/` - Real-time notifications

## 🎨 Key Features Implementation

### Real-time Chat
- WebSocket connections using Django Channels
- Message threading and read status
- Online presence indicators
- File sharing support

### Image Processing
- Automatic image resizing and optimization
- Support for multiple image formats
- Efficient storage and serving

### Responsive Design
- Mobile-first approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions

### Performance Optimizations
- Redis caching for sessions and real-time features
- Image optimization and lazy loading
- Efficient database queries with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Development Notes

### Database Migrations
```bash
# Create migrations
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate
```

### Debugging
- Backend logs: `docker-compose logs backend`
- Frontend logs: `docker-compose logs frontend`
- Database access: `docker-compose exec db mysql -u instagram_user -p instagram_db`

### Testing
```bash
# Backend tests
docker-compose exec backend python manage.py test

# Frontend tests (when implemented)
docker-compose exec frontend npm test
```

## 🚨 Known Issues

- File upload size limits may need adjustment for production
- WebSocket connections might need additional configuration for deployment
- Consider implementing image CDN for production use

## 🔮 Future Enhancements

- [ ] Stories feature
- [ ] Video upload support
- [ ] Advanced search filters
- [ ] Push notifications
- [ ] Two-factor authentication
- [ ] API rate limiting
- [ ] Content moderation
- [ ] Analytics dashboard

---

**Built with ❤️ by [Your Name]**