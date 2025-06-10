# Instagram Clone

A full-featured Instagram clone application built with Django REST Framework and React.

## Project Overview

This project is a comprehensive Instagram clone that implements core features like user authentication, posting images, following users, feeds, likes, comments, notifications, and direct messaging. The application is built with a modern tech stack and follows best practices for scalability and maintainability.

## Features

- **User Management**
  - User registration and authentication with JWT
  - User profiles with customizable information
  - Profile image upload and automatic resizing
  - Follow/unfollow users

- **Posts**
  - Create posts with images and captions
  - Tag posts with categories
  - Custom feed showing posts from followed users
  - Explore page to discover new content
  - Like/unlike posts

- **Interactions**
  - Comment on posts
  - Like posts and comments
  - Follow other users
  - Receive notifications for interactions

- **Direct Messaging**
  - Send private messages to other users
  - View conversation threads
  - Unread message indicators

- **Notifications**
  - Real-time notifications for likes, comments, and follows
  - Mark notifications as read

## Tech Stack

### Backend
- **Django & Django REST Framework** - Powerful Python web framework
- **MySQL** - Relational database for data storage
- **JWT Authentication** - Secure token-based authentication
- **Pillow** - Image processing library for handling uploads
- **Docker & Docker Compose** - Containerization for easy deployment

### Frontend
- **Next.js** - React framework for production-ready applications
- **React** - UI library for building component-based interfaces
- **TypeScript** - Type-safe JavaScript for better development experience
- **TailwindCSS** - Utility-first CSS framework
- **ESLint** - Code quality tool


## Backend Architecture

### Models
The application uses several key models to organize data:

- **User/Profile** - Extends Django's built-in User model with additional profile information
- **Post** - Stores user posts with associated images and metadata
- **Tag** - Allows categorization of posts
- **Comment** - Stores user comments on posts
- **Like** - Tracks post likes with unique constraints
- **Follow** - Manages user follow relationships
- **Stream** - Implements the feed mechanism
- **Message** - Handles direct messaging between users
- **Notification** - Manages user notifications

### API Endpoints

The backend provides a comprehensive REST API:

- `/api/users/` - User registration and management
- `/api/profiles/` - User profile management
- `/api/posts/` - Post creation, retrieval, and management
- `/api/comments/` - Comment operations
- `/api/likes/` - Like/unlike functionality
- `/api/follows/` - Follow/unfollow operations
- `/api/streams/` - User feed management
- `/api/tags/` - Post tagging functionality
- `/api/messages/` - Direct messaging
- `/api/notifications/` - User notifications

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/instagram-clone.git
   cd instagram-clone
   ```

2. Create a `.env` file in the root directory with the following content (modify as needed):
   ```
   # Django settings
   DEBUG=True
   SECRET_KEY=your-secret-key
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Database settings
   DB_ENGINE=django.db.backends.mysql
   DB_NAME=instagram_clone
   DB_USER=admin
   DB_PASSWORD=admin123
   DB_HOST=db
   DB_PORT=3306

   # Database Configuration
   MYSQL_ROOT_PASSWORD=root_password
   MYSQL_DATABASE=instagram_clone
   MYSQL_USER=admin
   MYSQL_PASSWORD=admin123

   # Backend Configuration
   DJANGO_PORT=8000
   ```

3. Start the application with Docker Compose:
   ```bash
   docker-compose up
   ```

4. Access the API at `http://localhost:8000/api/`
   - Default admin credentials: 
     - Username: admin
     - Password: admin123

## Development

### Backend Development
- The Django backend is located in the `backend/` directory
- Run migrations: `python manage.py migrate`
- Create superuser: `python manage.py createsuperuser`
- Run tests: `python manage.py test`

### Frontend Development
- The Next.js frontend is located in the `frontend/` directory
- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Run linting: `npm run lint`

## Project Structure

```
instagram-clone/
├── backend/               # Django backend
│   ├── backend/           # Main Django project
│   ├── comments/          # Comments app
│   ├── users/             # User management app
│   ├── posts/             # Posts and interactions app
│   ├── notifications/     # Notifications app
│   ├── chats/             # Direct messaging app
│   ├── media/             # User uploaded files
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Backend Docker configuration
│   └── entrypoint.sh      # Docker entrypoint script
├── frontend/              # Next.js frontend
│   ├── src/               # Source code
│   │   ├── app/           # Next.js app router
│   │   └── components/    # React components
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── Dockerfile         # Frontend Docker configuration
├── docker-compose.yml     # Docker Compose configuration
└── .env                   # Environment variables
```

## Acknowledgments

- Instagram for the inspiration
- Django and React communities for the amazing tools