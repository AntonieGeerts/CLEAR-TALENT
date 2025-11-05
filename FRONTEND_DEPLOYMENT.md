# Frontend Deployment Guide

The CLEAR-TALENT frontend has been created and is ready to deploy!

## 📦 What's Been Built

A complete React + TypeScript admin dashboard with:

✅ **Authentication** - Login/Register pages with JWT
✅ **Dashboard** - Overview with quick actions and stats
✅ **Competency Library** - CRUD operations + AI suggestions from job descriptions
✅ **Role Profiles** - Manage organizational roles
✅ **Goals & OKRs** - AI-powered goal generation
✅ **Skill Gaps** - Development opportunity identification
✅ **IDPs** - Individual Development Plans
✅ **Responsive Design** - Mobile-friendly UI
✅ **Modern UI** - TailwindCSS + Lucide icons

## 🚀 Quick Deploy to Vercel (Recommended - 5 minutes)

### Option 1: Vercel CLI (Fastest)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to frontend directory
cd frontend

# 3. Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? clear-talent-frontend
# - Directory? ./
# - Override settings? No

# 4. After deployment, set environment variable in Vercel dashboard:
# Visit: https://vercel.com/your-username/clear-talent-frontend/settings/environment-variables
# Add: VITE_API_URL = https://clear-talent-production.up.railway.app/api/v1

# 5. Redeploy to apply environment variable
vercel --prod
```

### Option 2: Vercel GitHub Integration (Automatic)

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://clear-talent-production.up.railway.app/api/v1`
6. Click "Deploy"

Your frontend will be live at: `https://clear-talent-frontend.vercel.app`

---

## Alternative: Deploy to Netlify

### Netlify CLI

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build the project
cd frontend
npm install
npm run build

# 3. Deploy
netlify deploy --prod --dir=dist

# 4. After deployment, set environment variable in Netlify dashboard:
# Visit: https://app.netlify.com/sites/YOUR_SITE/settings/deploys#environment
# Add: VITE_API_URL = https://clear-talent-production.up.railway.app/api/v1

# 5. Trigger new build to apply environment variable
```

### Netlify GitHub Integration

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://clear-talent-production.up.railway.app/api/v1`
6. Click "Deploy site"

---

## Alternative: Deploy to Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Navigate to frontend
cd frontend

# 4. Initialize and deploy
railway init
railway up

# 5. Set environment variable
railway variables --set VITE_API_URL=https://clear-talent-production.up.railway.app/api/v1

# 6. Configure start command in railway.json or dashboard:
# Build Command: npm run build
# Start Command: npx serve -s dist -l $PORT
```

---

## 🔧 Backend CORS Configuration

**IMPORTANT:** After deploying the frontend, update your backend CORS settings:

### In Railway Dashboard (Backend Service):

Add/Update the environment variable:
```
CORS_ORIGIN=https://your-frontend-domain.vercel.app,https://clear-talent-production.up.railway.app
```

Or for development + production:
```
CORS_ORIGIN=http://localhost:5173,https://your-frontend-domain.vercel.app
```

This allows the frontend to make API requests to the backend.

---

## 📱 Local Development

To run the frontend locally:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env with your API URL
# For local backend: VITE_API_URL=http://localhost:3000/api/v1
# For production backend: VITE_API_URL=https://clear-talent-production.up.railway.app/api/v1

# 5. Start development server
npm run dev

# Frontend will be available at: http://localhost:5173
```

---

## 🧪 Testing the Frontend

1. **Open the deployed URL** (e.g., https://clear-talent-frontend.vercel.app)

2. **Register a new account** or use demo credentials:
   - Email: `admin@demo.com`
   - Password: `SecurePass123!`

3. **Test key features:**
   - ✅ Login/Logout
   - ✅ Navigate between pages
   - ✅ Create a competency manually
   - ✅ Try AI competency suggestions (paste a job description)
   - ✅ View dashboard

---

## 🐛 Troubleshooting

### CORS Errors

**Problem:** `Access to fetch... has been blocked by CORS policy`

**Solution:**
1. Add your frontend domain to backend `CORS_ORIGIN` environment variable
2. Restart the backend service on Railway
3. Clear browser cache and reload

### 401 Unauthorized Errors

**Problem:** API returns 401 after login

**Solution:**
1. Check that `VITE_API_URL` is set correctly
2. Verify backend is running and accessible
3. Check browser console for token storage
4. Try logging out and logging in again

### Build Errors

**Problem:** Deployment fails during build

**Solution:**
1. Check that all dependencies are in `package.json`
2. Verify Node.js version compatibility (18+)
3. Run `npm install` and `npm run build` locally to test

### Environment Variables Not Working

**Problem:** Frontend can't connect to backend

**Solution:**
1. Verify `VITE_API_URL` is set in deployment platform
2. Note: Vite requires `VITE_` prefix for env vars
3. Redeploy after adding environment variables

---

## 📊 Deployment Checklist

- [ ] Frontend deployed to Vercel/Netlify/Railway
- [ ] `VITE_API_URL` environment variable set
- [ ] Backend `CORS_ORIGIN` updated with frontend domain
- [ ] Can access frontend URL successfully
- [ ] Can register/login successfully
- [ ] Can navigate between pages
- [ ] Can create a competency
- [ ] API calls work without CORS errors

---

## 🎉 Success!

Once deployed, you'll have:
- **Backend API**: https://clear-talent-production.up.railway.app
- **Frontend Dashboard**: https://your-frontend-domain.vercel.app

Users can now:
1. Register and login
2. Manage competencies with AI assistance
3. Create role profiles
4. Generate AI-powered goals and IDPs
5. Analyze skill gaps
6. Track employee development

---

## 📚 Next Steps

1. **Customize branding** - Update colors in `tailwind.config.js`
2. **Add more features** - Extend pages with additional functionality
3. **Set up CI/CD** - Automatic deployments on git push
4. **Add analytics** - Track user behavior
5. **Implement tests** - Add unit and integration tests
6. **Optimize performance** - Code splitting and lazy loading

---

## 💡 Pro Tips

- **Use Vercel** for easiest deployment and best DX
- **Enable automatic deployments** from main branch
- **Set up preview deployments** for pull requests
- **Monitor backend logs** in Railway dashboard
- **Use React DevTools** for debugging
- **Check Network tab** in browser for API issues

Enjoy your new CLEAR-TALENT dashboard! 🚀
