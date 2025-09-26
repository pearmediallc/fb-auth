# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: You need a production database. Options:
   - Vercel Postgres (Recommended)
   - Supabase
   - Neon
   - Any PostgreSQL provider with SSL

3. **Meta App Configuration**: Update your Meta app settings at [developers.facebook.com](https://developers.facebook.com)

## Step-by-Step Deployment

### 1. Database Setup

#### Option A: Vercel Postgres (Recommended)
1. In Vercel Dashboard, go to Storage → Create Database → Postgres
2. Connect it to your project
3. Vercel will automatically add the required environment variables

#### Option B: External PostgreSQL
1. Create a PostgreSQL database with your provider
2. Get the connection string (must include `?sslmode=require`)
3. You'll add this as `DATABASE_URL` in step 3

### 2. Update Meta App Settings

1. Go to your Meta App → Settings → Basic
2. Add your production domain to "App Domains": `your-app.vercel.app`
3. Go to Facebook Login → Settings
4. Add to "Valid OAuth Redirect URIs": `https://your-app.vercel.app/api/auth/callback`
5. Save changes

### 3. Deploy to Vercel

#### Using Vercel CLI:
```bash
cd frontend
npm install -g vercel
vercel
```

#### Using GitHub:
1. Push your code to GitHub
2. Import the repository in Vercel Dashboard
3. Set the root directory to `frontend`

### 4. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
# Meta OAuth (Required)
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_OAUTH_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
META_APP_SECRET=your_meta_app_secret

# Database (Required - Either Vercel Postgres OR DATABASE_URL)
DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require

# Security (Required - Generate unique values)
SESSION_SECRET=generate_32_char_random_string
ENCRYPTION_KEY=generate_another_32_char_string
```

### 5. Initialize Database

After deployment, run the database initialization by visiting:
```
https://your-app.vercel.app/api/auth/callback
```

This will trigger the database initialization on first run.

## Security Checklist

- [x] Environment variables are set in Vercel (not in code)
- [x] SESSION_SECRET is unique and random
- [x] ENCRYPTION_KEY is unique and random
- [x] Database connection uses SSL
- [x] Security headers are configured in middleware
- [x] OAuth redirect URI uses HTTPS

## Production Considerations

### 1. Database Connection Limits
Vercel functions have connection limits. The code uses:
- Vercel Postgres SDK (connection pooling handled automatically)
- Or standard pg with connection pooling

### 2. Function Timeouts
- API routes have 30-second timeout configured
- Long-running operations are avoided

### 3. Rate Limiting
Consider adding rate limiting for production:
```bash
npm install @vercel/kv rate-limiter
```

### 4. Monitoring
- Use Vercel Analytics for performance monitoring
- Set up error tracking (e.g., Sentry)
- Monitor Meta API rate limits

### 5. Scaling
- Cache is implemented (5-minute TTL)
- Consider increasing cache duration for production
- Use Vercel Edge Config for frequently accessed data

## Troubleshooting

### "Invalid OAuth Redirect URI"
- Ensure the exact URL is added in Meta App settings
- Check for trailing slashes
- Verify HTTPS is used

### Database Connection Errors
- Check DATABASE_URL includes `?sslmode=require`
- Verify database is accessible from Vercel's IP ranges
- Check connection pool limits

### Session Issues
- Ensure SESSION_SECRET is set and consistent
- Check cookie settings for production domain

### Token Decryption Errors
- Verify ENCRYPTION_KEY is set correctly
- Check it's the same key used for encryption

## Local Development with Production Database

To test with production database locally:
```bash
# Create .env.local
cp .env.example .env.local

# Add production database URL (be careful!)
DATABASE_URL=your_production_db_url

# Run locally
npm run dev
```

## Next Steps

1. Enable Vercel Analytics
2. Set up custom domain
3. Implement additional security measures:
   - CSRF protection
   - Rate limiting
   - IP allowlisting (if needed)
4. Set up monitoring and alerts
5. Regular security audits