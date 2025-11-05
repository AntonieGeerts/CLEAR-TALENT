# 🚂 Railway Deployment Instructions

## What You Need From Your Side:

### Prerequisites:
1. **A computer with terminal access** (Mac, Linux, or Windows with WSL/Git Bash)
2. **Node.js installed** (version 16 or higher)
   - Check: `node --version`
   - Download from: https://nodejs.org
3. **Git installed**
   - Check: `git --version`
4. **A Railway account** (FREE - you'll create this during deployment)
   - Visit: https://railway.app

### That's it! No credit card required for the free tier.

---

## 🚀 Super Simple Deployment (3 Commands)

Open your terminal and run:

```bash
# 1. Clone the repository
git clone <your-github-repo-url>
cd CLEAR-TALENT
git checkout claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK

# 2. Run the deployment script
chmod +x DEPLOY_RAILWAY.sh
./DEPLOY_RAILWAY.sh

# 3. Get your URL
railway status
```

**Done!** Your app will be live at `https://your-app.up.railway.app`

---

## 📋 Manual Step-by-Step (if script doesn't work)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```
This will open your browser. Create a free account if you don't have one.

### Step 3: Initialize Project
```bash
cd CLEAR-TALENT
railway init
```
Select "Create new project" and give it a name like "clear-talent-pmds"

### Step 4: Add PostgreSQL
```bash
railway add -d postgres
```

### Step 5: Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set JWT_SECRET=YOUR_JWT_SECRET_HERE
railway variables set OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
railway variables set OPENAI_MODEL=gpt-4o-mini
railway variables set AI_ENABLED=true
```

### Step 6: Deploy!
```bash
railway up
```

### Step 7: Setup Database
```bash
# Enable pgvector extension
railway run sh -c 'echo "CREATE EXTENSION IF NOT EXISTS vector;" | psql $DATABASE_URL'

# Run migrations
railway run npx prisma migrate deploy

# Seed with demo data
railway run npx prisma db seed
```

### Step 8: Generate Public URL
```bash
railway domain
```

### Step 9: Get Your URL
```bash
railway status
```

---

## 🧪 Testing Your Deployment

Once deployed, test with:

```bash
# Replace with your actual Railway URL
export APP_URL="https://your-app.up.railway.app"

# 1. Health check
curl $APP_URL/api/v1/health

# 2. Login to get a token
curl -X POST $APP_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo-org.com","password":"admin123"}'

# Copy the "token" from the response, then:

# 3. Test AI endpoint
curl $APP_URL/api/v1/ai/competencies/suggest \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Senior Software Engineer with 5+ years experience in Node.js, TypeScript, and React. Must have strong problem-solving skills and team leadership experience.",
    "industryContext": "Technology",
    "roleLevel": "Senior"
  }'
```

---

## 💰 Pricing

- **Free Tier**: $5/month credit (enough for small projects)
- **After Free Tier**: ~$10-20/month for this app
- **No credit card required** to start

---

## 🆘 Troubleshooting

### "railway: command not found"
```bash
npm install -g @railway/cli
```

### Build fails
Check the logs:
```bash
railway logs
```

### Database connection issues
Verify DATABASE_URL is set:
```bash
railway variables
```

### Still stuck?
Open Railway dashboard:
```bash
railway open
```

---

## 📱 Accessing Your Site

Once deployed, you can:

1. **Get the URL:**
   ```bash
   railway status
   ```

2. **Open in browser:**
   ```bash
   railway open
   ```

3. **View logs:**
   ```bash
   railway logs
   ```

4. **Access via direct URL:**
   `https://your-app-name.up.railway.app`

---

## 🎉 You're Done!

Your PMDS application with AI integration is now live on the internet!

**Demo Login:**
- Email: `admin@demo-org.com`
- Password: `admin123`

**API Documentation:**
- See `API_EXAMPLES.md` for complete API reference
- See `STAGE2_EXAMPLES.md` for Stage 2 feature examples

---

## 🔄 Updating Your Deployment

To deploy changes:

```bash
git pull origin claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK
railway up
```

---

**Need help?** Open an issue in your GitHub repository!
