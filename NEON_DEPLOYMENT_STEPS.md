# Deployment Steps for Meta Ad Checker with Neon DB

## ✅ Code is now pushed to GitHub!
Repository: https://github.com/pearmediallc/fb-auth

## 📋 Required Steps for Deployment

### 1. Get Your Neon Database Connection String
1. Go to your Neon dashboard
2. Copy your connection string (should look like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech:5432/database?sslmode=require
   ```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `pearmediallc/fb-auth`
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - Click "Deploy"

### 3. Add Environment Variables in Vercel
After deployment, go to your project Settings → Environment Variables and add:

```bash
# Neon Database
DATABASE_URL=your_neon_connection_string_here

# Meta App Configuration
NEXT_PUBLIC_META_APP_ID=your_meta_app_id
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NEXT_PUBLIC_OAUTH_REDIRECT_URI=https://your-project.vercel.app/api/auth/callback
META_APP_SECRET=your_meta_app_secret

# Security Keys (Generate random 32-character strings)
SESSION_SECRET=generate_32_character_random_string_here
ENCRYPTION_KEY=generate_another_32_character_string_here
```

**To generate random strings**, use:
```bash
openssl rand -base64 32
```

### 4. Update Your Meta App Settings
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Select your app → Settings → Basic
3. Add to "App Domains": `your-project.vercel.app`
4. Go to Facebook Login → Settings
5. Add to "Valid OAuth Redirect URIs": `https://your-project.vercel.app/api/auth/callback`
6. Save Changes

### 5. Redeploy with Environment Variables
1. In Vercel dashboard, go to Deployments
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Check "Use existing Build Cache" → Redeploy

### 6. Initialize Database
The database tables will be created automatically on the first API call.

## 🎉 Your App Should Now Be Live!

Visit: `https://your-project.vercel.app`

## 🐛 Troubleshooting

### "Database connection failed"
- Ensure your Neon connection string includes `?sslmode=require`
- Check that DATABASE_URL is set correctly in Vercel

### "OAuth redirect mismatch"
- Verify the exact URL (including https://) is in Meta app settings
- No trailing slashes!

### "Session/Token errors"
- Ensure SESSION_SECRET and ENCRYPTION_KEY are set
- These must be consistent across deployments

## 🔒 Security Checklist
- [ ] Different SESSION_SECRET than shown in examples
- [ ] Different ENCRYPTION_KEY than shown in examples
- [ ] Neon database has strong password
- [ ] Meta App Secret is kept secure
- [ ] HTTPS is enforced (automatic on Vercel)

## 📱 Meta App Permissions Required
Make sure your Meta app has these permissions enabled:
- `public_profile`
- `ads_read`
- `business_management`
- `pages_show_list`

## 🚀 Next Steps
1. Test the login flow
2. Verify ad accounts are displayed
3. Monitor usage in Vercel Analytics
4. Set up error tracking (optional)