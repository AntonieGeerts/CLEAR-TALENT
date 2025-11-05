# 🔧 Fix Railway Deployment Issue

## Problem: Railway is deploying from the wrong branch!

Railway is currently deploying from `main` branch (which only has README.md)
You need to deploy from: `claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK`

---

## ✅ Quick Fix (2 minutes):

### Option 1: Railway Dashboard (Easiest)

1. **Go to your Railway project:**
   👉 https://railway.app/project/f55ab408-5ea5-4d89-ad47-1ba935008f42

2. **Click on your service** (the one showing the error)

3. **Go to "Settings" tab**

4. **Scroll down to "Source Repo"**

5. **Change the branch:**
   - Find the **"Branch"** dropdown
   - Select: `claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK`
   - OR manually type: `claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK`

6. **Click "Update"** or it will auto-save

7. **Trigger a new deployment:**
   - Go to "Deployments" tab
   - Click "Deploy" or "Redeploy"

8. **Watch the build logs** - you should now see it building the full application!

---

### Option 2: Delete & Recreate Service

If the branch dropdown doesn't work:

1. **Delete the current service:**
   - In your service, go to Settings
   - Scroll to bottom
   - Click "Delete Service"

2. **Create new service:**
   - Click "+ New" in your project
   - Select "GitHub Repo"
   - Choose: `AntonieGeerts/CLEAR-TALENT`
   - **IMPORTANT:** Select branch: `claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK`
   - Click "Deploy"

3. **Add environment variables:**
   ```
   NODE_ENV=production
   PORT=8080
   JWT_SECRET=YOUR_JWT_SECRET_HERE
   OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
   OPENAI_MODEL=gpt-4o-mini
   AI_ENABLED=true
   ```

   **Note:** Replace placeholders with actual values from YOUR_RAILWAY_PROJECT.md (local file)

---

## ✅ What You Should See After Fix:

The build logs should show:

```
✓ Building with Dockerfile
✓ Installing dependencies (npm ci)
✓ Building TypeScript
✓ Prisma client generated
✓ Docker image created
✓ Deployment successful
```

Instead of just:
```
⚠ Script start.sh not found
✖ Railpack could not determine how to build
```

---

## 🎯 After Successful Build:

1. **Generate domain** (Settings → Networking → Generate Domain)

2. **Setup database** (PostgreSQL terminal):
   ```bash
   echo "CREATE EXTENSION IF NOT EXISTS vector;" | psql $DATABASE_URL
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Test your site:**
   ```bash
   curl https://your-url.up.railway.app/api/v1/health
   ```

---

## Why This Happened:

- Railway defaulted to the `main` branch
- The `main` branch only has a README.md
- All your code is on: `claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK`
- You need to tell Railway to deploy from the correct branch!

---

## 📱 Quick Links:

- **Your Project:** https://railway.app/project/f55ab408-5ea5-4d89-ad47-1ba935008f42
- **Correct Branch:** `claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK`
- **GitHub Repo:** https://github.com/AntonieGeerts/CLEAR-TALENT

---

**Follow Option 1 above and you'll be deployed in 2 minutes!** 🚀
