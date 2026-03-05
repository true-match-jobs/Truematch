# Environment Setup Guide

## Overview
This guide explains how to set up all required external services and environment variables for production deployment.

## Prerequisites
- Render account (https://render.com)
- Netlify account (https://netlify.com)
- GitHub repository with this code
- PostgreSQL database (Supabase recommended)
- Cloudinary account (for image storage)
- SMTP mail service (Zoho Mail recommended)

## 1. Database Setup (PostgreSQL via Supabase)

### Steps
1. Go to https://supabase.com
2. Create new project
3. Copy connection string from "Database" settings
4. Format: `postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require`

### Environment Variable
```
DATABASE_URL=postgresql://...copy...from...supabase...?sslmode=require
```

### Verify Connection
```bash
# From backend directory
npm run prisma:studio
```

## 2. JWT Secrets Generation

### Generate New Secrets
```bash
# Generate 32-character secrets (run this twice)
openssl rand -base64 32
```

Output example:
```
z7h8K2m9L3n4p5Q6r7S8t9U0v1W2x3Y4z5A6b7C8d9E0f1G2h3I4j5K6l7M8n9O0p1
```

### Environment Variables
```
JWT_ACCESS_SECRET=z7h8K2m9L3n4p5Q6r7S8t9U0v1W2x3Y4z5A6b7C8d9E0f1G2h3I4j5K6l7M8n9O0p1
JWT_REFRESH_SECRET=a2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t1U2v3W4x5Y6z7A8b9C0d1E2f3
```

**IMPORTANT**: Keep these secrets secure and never commit to version control.

## 3. Email Service (Zoho Mail)

### Setup Steps
1. Go to https://mail.zoho.com
2. Create regular user or use existing
3. Go to Settings → Security → Generate app-specific password
4. Copy the 16-character password

### Environment Variables
```
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_USER=noreply@truematch.chat
SMTP_PASS=16-character-app-password
SMTP_FROM_EMAIL=noreply@truematch.chat
SMTP_FROM_NAME=TrueMatch
EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=720
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
```

### Test Email
```bash
# Check backend logs for test email service startup
npm run dev
```

## 4. Image Storage (Cloudinary)

### Setup Steps
1. Go to https://cloudinary.com
2. Sign up / Log in
3. Go to Dashboard
4. Copy Cloud Name, API Key, API Secret

### Environment Variables
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### Verify Connection
Test by uploading a profile photo in development

## 5. Backend Deployment (Render)

### Step 1: Connect GitHub
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Authorize GitHub
4. Select repository

### Step 2: Configure Build
- **Name**: `truematch-backend`
- **Environment**: Node
- **Build Command**: `npm install && npm run build && npm run prisma:migrate:deploy`
- **Start Command**: `npm start`
- **Auto-deploy**: Enable

### Step 3: Add Environment Variables

In Render dashboard, add all these variables:

```
NODE_ENV=production
PORT=5000
FRONTEND_ORIGIN=https://truematch.netlify.app
DATABASE_URL=postgresql://...from-supabase...
JWT_ACCESS_SECRET=...from-generation-step...
JWT_REFRESH_SECRET=...from-generation-step...
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_USER=noreply@truematch.chat
SMTP_PASS=...16-char-app-password...
SMTP_FROM_EMAIL=noreply@truematch.chat
SMTP_FROM_NAME=TrueMatch
EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=720
EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
CLOUDINARY_CLOUD_NAME=...your-cloud-name...
CLOUDINARY_API_KEY=...your-api-key...
CLOUDINARY_API_SECRET=...your-api-secret...
```

### Step 4: Verify Deployment
1. Wait for build to complete
2. Test health endpoint: `https://[backend-url]/health`
3. Expected response: `{"status":"ok"}`

### Step 5: Get Backend URL
After deployment, you'll receive a URL like:
```
https://truematch-o121.onrender.com
```

**Save this URL** - needed for frontend configuration

## 6. Frontend Deployment (Netlify)

### Step 1: Update Frontend Config
In frontend directory, update `.env`:
```
VITE_API_BASE_URL=https://truematch-o121.onrender.com/api/v1
VITE_WS_BASE_URL=wss://truematch-o121.onrender.com/ws
VITE_SITE_URL=https://truematch.netlify.app
```

### Step 2: Connect to Netlify
1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Authorize GitHub
4. Select repository

### Step 3: Configure Build
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Step 4: Add Environment Variables

In Netlify UI, add:
```
VITE_API_BASE_URL=https://truematch-o121.onrender.com/api/v1
VITE_WS_BASE_URL=wss://truematch-o121.onrender.com/ws
VITE_SITE_URL=https://truematch.netlify.app
```

### Step 5: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Website is live at provided URL

### Step 6: Custom Domain (Optional)
1. In Netlify, go to "Site settings" → "Domain management"
2. Add custom domain
3. Configure DNS records as instructed

## 7. Troubleshooting

### Backend Won't Start
**Error**: "Port 5000 is already in use"
- Render automatically assigns a port
- Check render.yaml PORT variable

**Error**: "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify credentials

### Frontend Won't Deploy
**Error**: "Build failed"
- Check backend URL is correct in `.env`
- Verify all dependencies are installed
- Check TypeScript compilation errors

**Error**: "WebSocket connection fails"
- Verify backend URL in `.env`
- Check backend is running (test /health endpoint)
- Verify firewall allows WebSocket connections

### Messages Not Sending
- Verify WebSocket token is valid
- Check backend logs for errors
- Verify CORS origin matches frontend URL
- Test with test-messaging.js script

## 8. Environment Variable Checklist

### Backend (Render)
- [ ] NODE_ENV=production
- [ ] PORT=5000
- [ ] FRONTEND_ORIGIN=https://truematch.netlify.app
- [ ] DATABASE_URL=postgresql://...
- [ ] JWT_ACCESS_SECRET=32+ chars
- [ ] JWT_REFRESH_SECRET=32+ chars
- [ ] SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- [ ] SMTP_FROM_EMAIL, SMTP_FROM_NAME
- [ ] EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS=720
- [ ] EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS=60
- [ ] CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

### Frontend (Netlify)
- [ ] VITE_API_BASE_URL=https://truematch-o121.onrender.com/api/v1
- [ ] VITE_WS_BASE_URL=wss://truematch-o121.onrender.com/ws
- [ ] VITE_SITE_URL=https://truematch.netlify.app

## 9. Security Best Practices

1. **Never commit `.env` files** with secrets
2. **Use `.env.example`** template for documentation
3. **Rotate secrets** periodically
4. **Use strong passwords** for database and SMTP
5. **Enable 2FA** on all service accounts
6. **Monitor logs** for errors and anomalies
7. **Keep dependencies updated** for security patches
8. **Use HTTPS** for all production URLs
9. **Limit database access** to production network
10. **Use environment variables** for all secrets

## 10. Monitoring

### Monitor Backend (Render)
1. Go to Render dashboard
2. Select service
3. View "Events" for deployment history
4. View "Logs" for runtime errors

### Monitor Frontend (Netlify)
1. Go to Netlify dashboard
2. View "Deploys" for build history
3. View "Analytics" for traffic
4. Check "Functions" for errors if using them

### Monitor Database
1. Go to Supabase dashboard
2. Check "Monitoring" for connection metrics
3. Check "Logs" for query errors

## 11. Backup & Recovery

### Database Backup
Supabase automatically backs up daily. To restore:
1. Go to Supabase dashboard
2. Click "Settings" → "Backups"
3. Select restore point
4. Click "Restore"

### Code Rollback
**Frontend**: In Netlify, click "Deploys" and select previous deployment
**Backend**: In Render, click "Events" and select "Redeploy" on previous build

## 12. Scaling Considerations

As your application grows:
- Upgrade Render plan for more resources
- Enable Supabase connection pooling
- Add caching layer (Redis)
- Use CDN for static assets
- Monitor and optimize database queries
- Implement rate limiting per IP
- Add comprehensive logging and monitoring

## Need Help?

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Cloudinary Docs**: https://cloudinary.com/documentation
- **Application README**: See README.md for full documentation
