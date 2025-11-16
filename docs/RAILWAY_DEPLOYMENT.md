# Railway Deployment Guide

This guide walks you through deploying the Food Ordering App to [Railway](https://railway.app/), a modern platform-as-a-service that makes deployment simple.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Overview](#overview)
3. [Step 1: Create Railway Account](#step-1-create-railway-account)
4. [Step 2: Deploy PostgreSQL Database](#step-2-deploy-postgresql-database)
5. [Step 3: Deploy Backend API](#step-3-deploy-backend-api)
6. [Step 4: Deploy Frontend](#step-4-deploy-frontend)
7. [Step 5: Run Database Migrations](#step-5-run-database-migrations)
8. [Step 6: Configure Environment Variables](#step-6-configure-environment-variables)
9. [Step 7: Connect Frontend to Backend](#step-7-connect-frontend-to-backend)
10. [Troubleshooting](#troubleshooting)
11. [Production Best Practices](#production-best-practices)

---

## Prerequisites

Before deploying, ensure you have:

- A [GitHub](https://github.com) account with your code pushed to a repository
- A [Railway](https://railway.app) account (sign up with GitHub)
- Your project code committed and pushed to GitHub
- Basic understanding of environment variables
- **IMPORTANT**: Ensure all build configuration files are committed (see [Build Preparation](#build-preparation) below)

---

## Build Preparation

The project includes production-optimized TypeScript configurations that allow successful builds on Railway while maintaining strict type checking for local development.

### Files Already Configured

The following files should be in your repository:

**Backend:**
- `backend/tsconfig.prod.json` - Production TypeScript config with relaxed linting
- `backend/package.json` - Updated with `build` script using production config

**Frontend:**
- `frontend/tsconfig.prod.json` - Production TypeScript config
- `frontend/src/vite-env.d.ts` - Vite environment variable types
- `frontend/package.json` - Updated dependencies including `uuid` and `@types/uuid`

### Verify Before Deployment

Run these commands locally to ensure your build works:

```bash
# Test backend build
cd backend
npm install
npm run build

# Test frontend build
cd frontend
npm install
npm run build
```

If builds succeed locally, they'll succeed on Railway!

---

## Overview

Our deployment consists of three services on Railway:

1. **PostgreSQL Database** - Managed database service
2. **Backend API** - Express.js server with Prisma
3. **Frontend** - React application built with Vite

Railway will automatically build and deploy your services when you push changes to GitHub.

---

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your repositories
4. You'll receive $5 free credits (no credit card required initially)

---

## Step 2: Deploy PostgreSQL Database

### 2.1 Create New Project

1. Click "New Project" in Railway dashboard
2. Select "Provision PostgreSQL"
3. Railway will create a PostgreSQL instance

### 2.2 Get Database Credentials

1. Click on the PostgreSQL service
2. Go to "Variables" tab
3. Copy the `DATABASE_URL` - it looks like:
   ```
   postgresql://postgres:password@region.railway.app:port/railway
   ```
4. Save this URL - you'll need it for the backend

---

## Step 3: Deploy Backend API

### 3.1 Add Backend Service

1. In your Railway project, click "New"
2. Select "GitHub Repo"
3. Choose your repository
4. Railway will detect it's a Node.js project

### 3.2 Configure Build Settings

1. Click on the backend service
2. Go to "Settings" tab
3. Set the following:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `npm run start`
   - **Watch Paths**: `backend/**`

### 3.3 Set Environment Variables

Go to "Variables" tab and add these variables:

```bash
# Database (use the DATABASE_URL from PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS - will update after frontend deployment
CLIENT_URL=https://your-frontend-url.railway.app

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Email (Optional - configure if needed)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@foodordering.com

# Stripe (Optional - configure if needed)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Important Notes:**
- `${{Postgres.DATABASE_URL}}` automatically references your PostgreSQL database
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- You'll update CLIENT_URL after deploying the frontend

### 3.4 Deploy

1. Click "Deploy" or push to your GitHub repository
2. Railway will automatically build and deploy
3. Monitor logs in "Deployments" tab
4. Once deployed, copy the public URL (e.g., `https://backend-production-xxxx.up.railway.app`)

---

## Step 4: Deploy Frontend

### 4.1 Add Frontend Service

1. Click "New" in your Railway project
2. Select "GitHub Repo"
3. Choose the same repository
4. Create a new service for the frontend

### 4.2 Configure Build Settings

1. Click on the frontend service
2. Go to "Settings" tab
3. Set the following:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `frontend/**`

**Note**: The `start` command runs `serve` to serve the static built files from the `dist` directory.

### 4.3 Set Environment Variables

Go to "Variables" tab and add:

```bash
# Backend API URL (use the URL from your backend service)
VITE_API_URL=https://backend-production-xxxx.up.railway.app/api

# WebSocket URL (same as backend but with ws protocol)
VITE_WS_URL=https://backend-production-xxxx.up.railway.app
```

### 4.4 Deploy

1. Railway will automatically deploy after configuration
2. Copy the public URL (e.g., `https://frontend-production-yyyy.up.railway.app`)

---

## Step 5: Run Database Migrations

After backend deployment, you need to run Prisma migrations:

### Method 1: Using Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   cd backend
   railway link
   ```

4. Run migrations:
   ```bash
   railway run npm run prisma:migrate deploy
   ```

### Method 2: Using One-off Command in Dashboard

1. Go to backend service in Railway dashboard
2. Click on "Settings" → "Deploy"
3. Add a deployment trigger or manually run:
   ```bash
   npx prisma migrate deploy
   ```

### 4.5 Seed Database (Optional)

```bash
railway run npm run prisma:seed
```

---

## Step 6: Configure Environment Variables

### 6.1 Update Backend CORS

1. Go to backend service → Variables
2. Update `CLIENT_URL` with your frontend URL:
   ```
   CLIENT_URL=https://frontend-production-yyyy.up.railway.app
   ```
3. Service will automatically redeploy

### 6.2 Verify All Variables

Double-check these critical variables are set:

**Backend:**
- ✓ DATABASE_URL
- ✓ JWT_SECRET
- ✓ CLIENT_URL
- ✓ NODE_ENV=production

**Frontend:**
- ✓ VITE_API_URL
- ✓ VITE_WS_URL

---

## Step 7: Connect Frontend to Backend

### 7.1 Update API Configuration

Ensure your frontend's API configuration uses the environment variable:

```typescript
// frontend/src/config/api.ts or similar
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
```

### 7.2 Test the Connection

1. Visit your frontend URL
2. Try to register/login
3. Check browser console for errors
4. Monitor backend logs in Railway dashboard

---

## Troubleshooting

### Issue: Build Fails

**Check:**
- Build logs in Railway dashboard
- Ensure `package.json` has correct scripts
- Verify Node.js version compatibility
- **Ensure production tsconfig files exist (`tsconfig.prod.json`)**
- **Verify build command uses production config**

**Solution:**

The project is configured with production-optimized TypeScript settings. Ensure these files are committed:

**Backend** - `backend/tsconfig.prod.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Frontend** - `frontend/tsconfig.prod.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Frontend** - `frontend/src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Also ensure `package.json` scripts are correct:
```bash
# Backend: npm run build should use production config
"build": "tsc -p tsconfig.prod.json"

# Frontend: npm run build should use production config
"build": "tsc -p tsconfig.prod.json && vite build"
```

If still failing, add to `package.json`:
```json
"engines": {
  "node": "18.x",
  "npm": "9.x"
}
```

### Issue: Database Connection Errors

**Check:**
- DATABASE_URL is correctly set
- PostgreSQL service is running
- Prisma migrations have been run

**Solution:**
```bash
# Re-run migrations
railway run npx prisma migrate deploy

# Regenerate Prisma Client
railway run npx prisma generate
```

### Issue: CORS Errors

**Check:**
- CLIENT_URL in backend matches frontend URL exactly
- No trailing slashes in URLs
- CORS middleware is configured correctly

**Solution:**
Update backend variables and check [backend/src/server.ts](../backend/src/server.ts) CORS config:
```typescript
cors({
  origin: process.env.CLIENT_URL,
  credentials: true
})
```

### Issue: Frontend Cannot Reach Backend

**Check:**
- VITE_API_URL is set correctly
- Backend is deployed and running
- Network tab in browser dev tools

**Solution:**
- Ensure environment variables are set in Railway
- Rebuild frontend after changing variables
- Check backend public URL is accessible

### Issue: 502 Bad Gateway

**Check:**
- Backend is listening on the correct PORT
- Health check endpoint exists

**Solution:**
```typescript
// Ensure server listens on Railway's PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Issue: File Uploads Not Working

**Check:**
- Railway's ephemeral filesystem
- Uploads directory configuration

**Solution:**
Use cloud storage for production:
- AWS S3
- Cloudinary
- Railway Volumes (persistent storage)

### Issue: WebSocket Connection Failed

**Check:**
- Railway supports WebSockets by default
- WS URL uses `https://` (Railway handles upgrade)

**Solution:**
```typescript
// Frontend WebSocket connection
const socket = io(import.meta.env.VITE_WS_URL, {
  transports: ['websocket', 'polling']
});
```

---

## Production Best Practices

### 1. Environment Variables

- Never commit `.env` files
- Use Railway's built-in variable management
- Reference other services with `${{ServiceName.VARIABLE}}`
- Keep secrets secure and rotate them regularly

### 2. Database

- Enable automatic backups in PostgreSQL settings
- Monitor database size and performance
- Use connection pooling for better performance
- Run migrations carefully (test in staging first)

### 3. Monitoring

- Enable health checks:
  ```typescript
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });
  ```
- Monitor Railway metrics (CPU, Memory, Network)
- Set up error tracking (Sentry, LogRocket)
- Check logs regularly for errors

### 4. Security

- Use strong JWT_SECRET (32+ characters)
- Enable rate limiting in production
- Set secure cookie options
- Validate all inputs
- Keep dependencies updated

### 5. Performance

- Enable compression middleware
- Use CDN for static assets
- Optimize images before upload
- Implement caching where appropriate
- Monitor response times

### 6. Deployment Strategy

- Use separate Railway projects for staging/production
- Test thoroughly in staging before production deploy
- Enable auto-deploy from main branch
- Use preview deployments for pull requests
- Keep rollback strategy ready

### 7. Costs Optimization

- Monitor Railway usage dashboard
- Use appropriate service sizing
- Clean up old deployments
- Optimize build times
- Consider usage-based scaling

---

## Additional Railway Features

### Custom Domains

1. Go to service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Add DNS records as shown
5. Railway provides automatic SSL certificates

### Deploy Hooks

Trigger deployments via webhooks:
```bash
curl -X POST https://railway.app/api/deploy/YOUR_HOOK_ID
```

### Railway CLI Commands

```bash
# View logs
railway logs

# Open service in browser
railway open

# Run commands in production
railway run <command>

# Shell into service
railway shell

# View current status
railway status
```

### Preview Deployments

Enable in Settings → GitHub:
- Automatic deployments for pull requests
- Separate URLs for each PR
- Test changes before merging

---

## Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] Seed data added (if needed)
- [ ] Frontend connects to backend successfully
- [ ] Authentication works (register/login)
- [ ] File uploads working (or cloud storage configured)
- [ ] WebSocket connections established
- [ ] CORS configured correctly
- [ ] SSL certificates active (automatic with Railway)
- [ ] Custom domain configured (optional)
- [ ] Error tracking enabled
- [ ] Monitoring and alerts set up
- [ ] Backups configured
- [ ] Team members have access
- [ ] Documentation updated with production URLs

---

## Useful Links

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Project Setup Guide](../SETUP.md)
- [API Documentation](./API.md)

---

## Getting Help

If you encounter issues:

1. Check Railway logs for error messages
2. Review this troubleshooting section
3. Search Railway Discord for similar issues
4. Check Railway status page for outages
5. Contact Railway support (Pro plan)

---

**Congratulations!** Your food ordering app is now deployed on Railway and ready to serve users worldwide!

For local development setup, see [SETUP.md](../SETUP.md).
