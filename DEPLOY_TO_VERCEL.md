# 🚀 Deploy Frontend to Vercel (GitHub Integration)

Since direct CLI deployment encountered network issues, here's the **best way** to deploy using GitHub integration (takes 2 minutes and gives you automatic deployments!).

## Method 1: GitHub Integration (Recommended) ⭐

### Step 1: Go to Vercel
Visit: https://vercel.com/new

### Step 2: Import Your Repository
1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Find and select: `AntonieGeerts/CLEAR-TALENT`
4. Click "Import"

### Step 3: Configure Project Settings
```
Root Directory: frontend
Framework Preset: Vite (should auto-detect)
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 4: Add Environment Variable
Click "Environment Variables" section and add:
```
Name: VITE_API_URL
Value: https://clear-talent-production.up.railway.app/api/v1
```

### Step 5: Deploy
Click "Deploy" button

⏱️ Deployment will take about 1-2 minutes.

### Step 6: Get Your URL
Once deployed, you'll get a URL like:
`https://clear-talent-frontend-xyz123.vercel.app`

---

## Method 2: Direct Vercel CLI (Alternative)

If you want to deploy from your local machine instead:

```bash
# 1. Open terminal in the frontend directory
cd /path/to/CLEAR-TALENT/frontend

# 2. Install Vercel CLI (if not already installed)
npm install -g vercel

# 3. Login to Vercel
vercel login

# 4. Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? clear-talent-frontend
# - Directory? ./
# - Override settings? No

# 5. Deploy to production
vercel --prod

# 6. Add environment variable in Vercel dashboard
# Visit: https://vercel.com/your-username/clear-talent-frontend/settings/environment-variables
# Add: VITE_API_URL = https://clear-talent-production.up.railway.app/api/v1

# 7. Redeploy to apply variable
vercel --prod
```

---

## After Deployment: Update Backend CORS ⚠️

**CRITICAL STEP** - Your frontend won't work without this!

1. Go to Railway dashboard: https://railway.app
2. Select your CLEAR-TALENT backend project
3. Go to "Variables" tab
4. Add or update:
   ```
   CORS_ORIGIN=https://your-frontend-url.vercel.app,http://localhost:5173
   ```
5. Click "Redeploy" or the service will restart automatically

---

## Verify Deployment ✅

1. Visit your Vercel URL
2. You should see the login page
3. Click "Sign up" and create an account
4. If you can login and see the dashboard, it's working! 🎉

---

## Troubleshooting

### CORS Errors
- **Problem**: "Access to fetch... has been blocked by CORS policy"
- **Solution**: Make sure you updated `CORS_ORIGIN` in Railway backend

### Can't Login
- **Problem**: Login button doesn't work or gives error
- **Solution**:
  - Check browser console for errors
  - Verify `VITE_API_URL` is set in Vercel
  - Verify backend is running: https://clear-talent-production.up.railway.app/api/v1/health

### Build Fails
- **Problem**: Deployment fails during build
- **Solution**:
  - Check that "Root Directory" is set to `frontend`
  - Verify Node.js version is 18 or higher
  - Check build logs in Vercel dashboard

---

## Next Steps After Deployment

1. ✅ Test login/register
2. ✅ Create your first competency
3. ✅ Try AI competency suggestions
4. ✅ Set up OpenAI API key in Railway (for AI features)
5. ✅ Invite team members

---

## Benefits of GitHub Integration

- ✨ **Automatic Deployments** - Push to GitHub = automatic deploy
- 🔄 **Preview Deployments** - Each PR gets its own preview URL
- 🌍 **Global CDN** - Fast loading worldwide
- 📊 **Analytics** - Built-in performance monitoring
- 🔒 **HTTPS** - Automatic SSL certificates
- 🎯 **Rollbacks** - Easy to rollback to previous versions

---

Your frontend is ready to deploy! Choose either method above. 🚀
