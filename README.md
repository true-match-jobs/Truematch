# Truematch Platform

Production-ready full-stack scaffold for a commercial education agency platform with real-time messaging, user authentication, and job/university management.

## Quick Links

- 📚 [Deployment Guide](./DEPLOYMENT.md) - Complete production deployment instructions
- ✅ [Production Checklist](./PRODUCTION_CHECKLIST.md) - Pre-deployment verification
- 🔧 [Development Setup](#development-setup) - Local development guide

## Technology Stack

### Backend
- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSocket (ws)
- **Authentication**: JWT with httpOnly cookies
- **Security**: bcrypt, Helmet, CORS, Rate Limiting
- **Validation**: Zod
- **File Storage**: Cloudinary
- **Email**: SMTP (Zoho Mail)

### Frontend
- **UI Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v7
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod validation
- **Icons**: Phosphor Icons

## Project Structure

```
truematch/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── modules/           # Feature modules (auth, chat, users, etc.)
│   │   ├── config/            # Configuration (database, environment)
│   │   ├── middleware/        # Express middleware
│   │   ├── utils/             # Utility functions
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Server entry point
│   ├── prisma/                # Database schema and migrations
│   └── package.json
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/             # Route pages
│   │   ├── components/        # Reusable components
│   │   ├── services/          # API and WebSocket services
│   │   ├── store/             # Zustand stores
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   ├── App.tsx            # App root component
│   │   └── main.tsx           # React entry point
│   ├── index.html
│   └── package.json
├── shared/                     # Shared types and utilities
├── DEPLOYMENT.md              # Production deployment guide
├── PRODUCTION_CHECKLIST.md    # Pre-deployment checklist
└── README.md                  # This file
```

## Development Setup

### Prerequisites
- Node.js v20+ and npm/pnpm
- PostgreSQL (local or cloud - Supabase recommended)
- Git

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_ACCESS_SECRET` - Generate with: `openssl rand -base64 32`
   - `JWT_REFRESH_SECRET` - Generate with: `openssl rand -base64 32`
   - `CLOUDINARY_*` - Your Cloudinary credentials
   - `SMTP_*` - Your email service credentials

4. Set up database:
   ```bash
   npm run prisma:migrate dev --name init
   ```

5. Start development server:
   ```bash
   npm run dev
   ```
   
   Backend runs on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   For development, the defaults should work with Vite's proxy.

4. Start development server:
   ```bash
   npm run dev
   ```
   
   Frontend runs on `http://localhost:5173`

## Development Commands

### Backend

```bash
cd backend

# Start dev server with hot reload
npm run dev

# Stop dev server on port 5000
npm run dev:stop

# Fresh dev server
npm run dev:fresh

# Build for production
npm run build

# Start production build
npm start

# Manage Prisma
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Create migration
npm run prisma:migrate:deploy  # Apply migrations
npm run prisma:studio      # Open Prisma Studio UI
```

### Frontend

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate logo assets
npm run generate:logo-assets
```

## Key Features

### Authentication
- Email/password registration and login
- JWT-based authentication with 15-minute access tokens
- Refresh token rotation (7-day expiration)
- Email verification with 720-hour tokens
- Role-based access control (USER, ADMIN)

### Real-time Messaging
- WebSocket-based messaging between users and admins
- Presence tracking (online/offline status)
- Typing indicators
- Message persistence to database
- Unread message counts

### Admin Dashboard
- Manage conversations with users
- View application submissions
- Manage universities and job listings
- Create and edit course information

### User Dashboard
- Browse universities and job listings
- Submit applications
- Real-time chat with admins
- Profile management
- Document uploads (PDF, images)

## API Endpoints

All endpoints are prefixed with `/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/email-verification/verify` - Verify email
- `POST /auth/email-verification/resend` - Resend verification

### Users
- `GET /users/me` - Get current user
- `PATCH /users/me/profile` - Update profile
- `PATCH /users/me/avatar` - Upload avatar
- `PATCH /users/me/email` - Change email
- `PATCH /users/me/password` - Change password

### Chat
- `GET /chat/peer` - Get chat partner info
- `GET /chat/messages/:peerUserId` - Get conversation messages
- `GET /chat/conversations` - Get all conversations (admin)
- `GET /chat/unread-summary` - Get unread counts
- `PATCH /chat/read/:peerUserId` - Mark conversation as read
- `POST /chat/attachments` - Upload attachment
- `POST /chat/attachments/download` - Download attachment

### WebSocket
- Connect to `/ws?token=<JWT>`
- Message types:
  - `private_message` - Send/receive messages
  - `typing` - Typing indicators
  - `presence_subscribe` - Subscribe to user presence
  - `presence_update` - User online/offline update

## Configuration

### Environment Variables

See `.env.example` files in backend and frontend directories for complete lists.

**Critical for Production:**
- `NODE_ENV=production`
- `FRONTEND_ORIGIN` - Must match frontend URL exactly
- `JWT_ACCESS_SECRET` - 32+ character random string
- `JWT_REFRESH_SECRET` - 32+ character random string
- `DATABASE_URL` - Must use SSL (sslmode=require)

## Security

### Backend Security
- ✅ Helmet.js for security headers
- ✅ CORS configured for production domain
- ✅ Rate limiting on auth endpoints
- ✅ Password hashing with bcrypt
- ✅ JWT token validation
- ✅ SQL injection protection via Prisma
- ✅ Error messages don't expose internals in production

### Frontend Security
- ✅ XSS protection via React's default escaping
- ✅ CSRF tokens in cookies for state-changing requests
- ✅ Secure cookie flags (httpOnly, Secure, SameSite)
- ✅ No secrets in frontend code
- ✅ Content Security Policy headers

## Database

### Schema
- **Users** - User accounts with roles (USER, ADMIN)
- **Applications** - Job/university applications
- **ChatMessages** - Real-time message history
- **Universities** - Listed universities
- **Jobs** - Job postings
- **Courses** - Course information
- **Notifications** - System and admin notifications

### Migrations
Located in `backend/prisma/migrations/`

Apply migrations automatically on production via:
```bash
npm run prisma:migrate:deploy
```

## Deployment

For complete production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Summary
- **Backend**: Deploy to Render
- **Frontend**: Deploy to Netlify
- **Database**: PostgreSQL (Supabase recommended)
- **Files**: Cloudinary
- **Email**: SMTP (Zoho Mail)

### Pre-deployment
Review [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) before deploying

## Troubleshooting

### WebSocket Connection Fails
- Verify backend is running
- Check FRONTEND_ORIGIN env var matches actual frontend URL
- Verify firewall allows WebSocket connections

### Authentication Issues
- Clear browser cookies
- Verify JWT secrets are set correctly
- Check token expiration times

### Database Connection Issues
- Verify DATABASE_URL syntax
- Ensure SSL mode is required if using cloud database
- Check database user permissions

### Email Not Sending
- Verify SMTP credentials
- Check SMTP_FROM_EMAIL is configured
- Look for errors in backend logs

## Performance

### Optimizations
- Frontend code splitting via React Router
- Lazy loading of routes
- Asset caching with fingerprinting
- Database connection pooling
- WebSocket message batching
- Gzip compression via Helmet

### Monitoring
- Health check endpoint: `GET /health`
- WebSocket connection monitoring
- Error logging with structured JSON
- Database performance metrics (via Prisma)

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Commit with descriptive message: `git commit -m 'Add feature'`
4. Push to GitHub: `git push origin feature/my-feature`
5. Create Pull Request

## License

Private - All rights reserved

## Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
2. Review [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
3. Check backend logs in Render dashboard
4. Check frontend logs in browser console
- `POST /api/v1/auth/refresh` rotates session cookies.
- `POST /api/v1/auth/logout` clears auth cookies.
- Zod validates auth DTOs.
- Helmet, strict CORS origin, and auth route rate limits are enabled.

## WebSocket

- Endpoint: `ws://localhost:5000/ws?token=<accessToken>`
- JWT validated at connection.
- In-memory userId → socket map enables USER ↔ ADMIN private messaging base.

## Implemented UX

- Landing page with responsive hero and CTA.
- `/apply` multi-step-ready stepper flow (Step 1 account details implemented).
- Auto-login after registration, then redirect to `/dashboard`.
- `/login` for existing users.
- Protected `/dashboard` with sidebar, welcome section, placeholders for status/messages/logout.
