# Production Deployment Guide - Truematch

## Overview
This guide covers deploying the Truematch application to production using Render (backend) and Netlify (frontend).

## Backend Deployment (Render)

### Prerequisites
- Render account (free tier available)
- PostgreSQL database (Supabase recommended)
- Cloudinary account for image storage
- Zoho Mail or equivalent SMTP service

### Environment Variables Required
The following environment variables must be set in Render dashboard:

```
NODE_ENV=production
PORT=5000
FRONTEND_ORIGIN=https://truematch.netlify.app
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
JWT_ACCESS_SECRET=[generate with: openssl rand -base64 32]
JWT_REFRESH_SECRET=[generate with: openssl rand -base64 32]
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=[app-specific password]
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=TrueMatch
EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=720
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
CLOUDINARY_CLOUD_NAME=[your cloud name]
CLOUDINARY_API_KEY=[your api key]
CLOUDINARY_API_SECRET=[your api secret]
```

### Deployment Process

1. **Create Render Service**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `main` branch

2. **Configure Service**
   - **Name**: truematch-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build && npm run prisma:migrate:deploy`
   - **Start Command**: `npm start`
   - **Auto-deploy**: Enable

3. **Add Environment Variables**
   - Add all variables listed above in Render dashboard
   - **Never commit secrets to git**

4. **Monitor Deployment**
   - View logs in Render dashboard
   - Verify health check passes: `GET /health`

### Post-Deployment Checklist
- [ ] Verify `/health` endpoint returns 200 status
- [ ] Check WebSocket connection: `wss://[backend-url]/ws`
- [ ] Test authentication flow (login/signup)
- [ ] Verify email notifications work
- [ ] Test message sending through WebSocket
- [ ] Monitor error logs for issues

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account (free tier available)
- GitHub repository linked

### Environment Variables
The `.env` file in frontend directory must contain:

```
VITE_API_BASE_URL=https://truematch-o121.onrender.com/api/v1
VITE_WS_BASE_URL=wss://truematch-o121.onrender.com/ws
VITE_SITE_URL=https://truematch.netlify.app
```

### Deployment Process

1. **Connect Repository**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize
   - Choose your repository

2. **Configure Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

3. **Set Environment Variables**
   - Go to "Site settings" → "Build & deploy" → "Environment"
   - Add the three VITE_* variables above

4. **Configure Domain**
   - Update custom domain or use Netlify subdomain
   - **Current**: `https://truematch.netlify.app`

5. **Deploy**
   - Push changes to `main` branch
   - Netlify automatically builds and deploys

### Post-Deployment Checklist
- [ ] Verify site loads at custom domain
- [ ] Test login functionality
- [ ] Verify chat/messaging works
- [ ] Check console for errors
- [ ] Verify redirects work (`/api/*` → backend)
- [ ] Test WebSocket connection
- [ ] Check security headers in browser DevTools

## Database Migrations

Migrations run automatically during Render deployment via:
```bash
npm run prisma:migrate:deploy
```

### Manual Migration (if needed)
```bash
cd backend
npm run prisma:migrate:deploy
```

### Creating New Migrations
```bash
cd backend
npm run prisma:migrate dev --name migration_name
```

## Monitoring & Maintenance

### Backend Logs
View in Render dashboard:
- Service logs for errors
- Build logs for deployment issues

### Frontend Build Logs
View in Netlify:
- Deploy logs for build issues
- Production logs for runtime errors

### Health Checks
- Backend: `GET https://[backend-url]/health`
- Expected response: `{"status":"ok"}`

### Common Issues

#### WebSocket Connection Fails
- Verify `FRONTEND_ORIGIN` matches actual frontend URL
- Check backend is running: `curl https://[backend-url]/health`
- Verify firewall allows WebSocket connections

#### Authentication Fails
- Verify JWT secrets are set in Render
- Check cookie domain settings
- Ensure CORS is properly configured

#### Database Migrations Fail
- Check `DATABASE_URL` is correct
- Verify database user has permissions
- Check migration files for syntax errors

#### Image Uploads Fail
- Verify Cloudinary credentials
- Check file size limits
- Verify allowed MIME types

## Security Checklist

- [x] JWT secrets are 32+ characters
- [x] CORS origin is restricted to production frontend
- [x] Database URL uses SSL mode
- [x] Sensitive data not committed to git
- [x] Security headers enabled in Netlify
- [x] HTTPS enforced for all traffic
- [x] WebSocket token validation implemented
- [x] Error messages don't expose internal details
- [x] Environment variables not logged in production

## Performance Optimization

### Frontend
- Vite build output optimized with tree-shaking
- Assets cached with immutable fingerprints
- HTML cached with revalidation headers
- WebSocket connection pooled per user

### Backend
- Connection pooling enabled for database
- Response compression via helmet
- Rate limiting on auth endpoints
- WebSocket message validation

## Rollback Procedure

### Frontend (Netlify)
1. Go to Netlify dashboard
2. Click "Deploys"
3. Select previous deployment
4. Click "Publish deploy"

### Backend (Render)
1. Go to Render dashboard
2. Click "Events"
3. Find previous successful deployment
4. Click "Redeploy"

## Support Resources

- Render Docs: https://render.com/docs
- Netlify Docs: https://docs.netlify.com
- Prisma Docs: https://www.prisma.io/docs
- Express Docs: https://expressjs.com
- React Router Docs: https://reactrouter.com
