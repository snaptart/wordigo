# Wordigo Deployment Guide - Render

This guide will help you deploy Wordigo to Render for user testing.

## Prerequisites

- GitHub account with your Wordigo repository
- Render account (free tier is sufficient for testing)
- Your code committed and pushed to GitHub

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Connect Render to GitHub**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing `render.yaml`
   - Click "Apply"

3. **Render will automatically:**
   - Create a PostgreSQL database
   - Deploy the backend API
   - Deploy the frontend static site
   - Set up environment variables
   - Run database migrations

### Option 2: Manual Deployment

If you prefer to set up services individually:

#### 1. Create PostgreSQL Database

1. In Render Dashboard, click "New" → "PostgreSQL"
2. Name: `wordigo-db`
3. Database: `wordigo`
4. User: `wordigo`
5. Region: Oregon (or closest to you)
6. Plan: Free
7. Click "Create Database"
8. **Save the Internal Database URL** (you'll need this)

#### 2. Deploy Backend

1. Click "New" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name:** `wordigo-backend`
   - **Region:** Oregon (same as database)
   - **Branch:** main (or your default branch)
   - **Root Directory:** `wordigo-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
   - **Plan:** Free

4. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `DATABASE_URL` = (paste the Internal Database URL from step 1)
   - `JWT_SECRET` = (generate a random string, e.g., use a password generator)
   - `JWT_ACCESS_EXPIRY` = `15m`
   - `JWT_REFRESH_EXPIRY` = `30d`
   - `FRONTEND_URL` = (leave blank for now, add after frontend deployment)

5. Click "Create Web Service"
6. **Save the backend URL** (e.g., `https://wordigo-backend.onrender.com`)

#### 3. Deploy Frontend

1. Click "New" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name:** `wordigo-frontend`
   - **Region:** Oregon
   - **Branch:** main
   - **Root Directory:** `wordigo-web`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Environment Variables:**
   - `VITE_API_URL` = `https://wordigo-backend.onrender.com/api` (use your backend URL)

5. Click "Create Static Site"

#### 4. Update Backend Environment Variable

1. Go back to your backend service settings
2. Update `FRONTEND_URL` to your frontend URL (e.g., `https://wordigo-frontend.onrender.com`)
3. Save changes (this will trigger a redeploy)

## Post-Deployment

### Verify Deployment

1. **Check Backend Health:**
   - Visit: `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Frontend:**
   - Visit: `https://your-frontend-url.onrender.com`
   - The app should load

3. **Test the Application:**
   - Try starting a game
   - Check browser console for any errors

### Common Issues

#### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Check database is in the same region as the backend
- Ensure migrations ran successfully (check backend logs)

#### CORS Errors
- Verify `FRONTEND_URL` is set correctly in backend
- Check it matches your actual frontend URL (with https://)
- No trailing slash in the URL

#### API Not Found (404)
- Verify `VITE_API_URL` includes `/api` at the end
- Check backend is deployed and running
- Verify the URL format: `https://your-backend.onrender.com/api`

#### Frontend Not Loading
- Check build logs for errors
- Verify `dist` directory is being published
- Check for TypeScript errors

### Free Tier Limitations

- **Web Services:** Spin down after 15 minutes of inactivity
- **First Request:** May take 30-60 seconds (cold start)
- **Database:** 90-day expiration on free tier
- **Monthly Hours:** 750 hours per service

### Monitoring

- **Backend Logs:** Render Dashboard → wordigo-backend → Logs
- **Frontend Logs:** Render Dashboard → wordigo-frontend → Logs
- **Database:** Render Dashboard → wordigo-db → Metrics

## Sharing with Users

Once deployed, share the frontend URL:
```
https://wordigo-frontend.onrender.com
```

### Tips for User Testing:
1. Warn users about cold starts (first load may be slow)
2. Provide a feedback form or email
3. Monitor error logs regularly
4. Set up error tracking (optional: Sentry, LogRocket)

## Updating Your Deployment

When you make changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically:
- Detect the push
- Rebuild the services
- Deploy the new version

## Environment Variables Reference

### Backend
- `NODE_ENV` - Set to `production`
- `PORT` - Port number (3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_ACCESS_EXPIRY` - Access token expiry (15m)
- `JWT_REFRESH_EXPIRY` - Refresh token expiry (30d)
- `FRONTEND_URL` - Your frontend URL for CORS

### Frontend
- `VITE_API_URL` - Backend API URL with `/api` path

## Costs

**Free Tier (Sufficient for Testing):**
- PostgreSQL: Free for 90 days
- Backend: Free (with limitations)
- Frontend: Free

**If You Need More:**
- Starter PostgreSQL: $7/month (no expiration)
- Starter Web Service: $7/month (no spin down)

## Support

If you encounter issues:
1. Check Render logs for errors
2. Review this guide's "Common Issues" section
3. Check [Render Documentation](https://render.com/docs)
4. Contact Render support (very responsive)

---

**Your app is now live and ready for user feedback!**
