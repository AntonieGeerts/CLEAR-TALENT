# 🚀 Quick Start - Deploy Your PMDS App in 2 Minutes

## What I Need From You:

Just **run one script** on your computer. That's it!

---

## ✅ Step 1: Open Terminal on Your Computer

- **Mac**: Open "Terminal" app
- **Windows**: Open "Git Bash" or "PowerShell"
- **Linux**: Open your terminal

---

## ✅ Step 2: Clone and Deploy

Copy and paste these commands:

```bash
# Clone the repository (replace with your actual repo URL)
git clone https://github.com/AntonieGeerts/CLEAR-TALENT.git
cd CLEAR-TALENT
git checkout claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK

# Run the deployment script
chmod +x DEPLOY_WITH_TOKEN.sh
./DEPLOY_WITH_TOKEN.sh
```

**That's it!** The script will:
- ✅ Install Railway CLI automatically
- ✅ Create your Railway project
- ✅ Add PostgreSQL database
- ✅ Set all environment variables
- ✅ Deploy your application
- ✅ Run database migrations
- ✅ Seed demo data
- ✅ Give you a live URL

**Time: ~2-3 minutes**

---

## ✅ Step 3: Access Your Site

After the script finishes, you'll see:

```
✅ Your application is live at:
   https://clear-talent-pmds-production.up.railway.app
```

Open that URL in your browser!

---

## 🧪 Testing Your Site

### 1. Health Check
```bash
curl https://your-url.up.railway.app/api/v1/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 2. Login
```bash
curl -X POST https://your-url.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo-org.com","password":"admin123"}'
```

You'll get back a JWT token!

### 3. Test AI Features
Use the token from step 2:

```bash
curl https://your-url.up.railway.app/api/v1/ai/competencies/suggest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Senior Software Engineer with Node.js and TypeScript experience",
    "industryContext": "Technology",
    "roleLevel": "Senior"
  }'
```

---

## 📱 Access Via Browser

Open your Railway URL and add these paths:

- **Health Check**: `/api/v1/health`
- **API Docs**: See `API_EXAMPLES.md` in the repo

**Demo Login:**
- Email: `admin@demo-org.com`
- Password: `admin123`

---

## 🆘 Troubleshooting

### "npm: command not found"
Install Node.js from: https://nodejs.org

### "railway: command not found" 
The script will install it automatically, but if needed:
```bash
npm install -g @railway/cli
```

### Script fails?
Run commands manually from `RAILWAY_DEPLOY_INSTRUCTIONS.md`

### Check deployment status
```bash
export RAILWAY_TOKEN="ba68f40d-f301-40d2-a0ba-1247f2c4600a"
railway status
```

### View logs
```bash
export RAILWAY_TOKEN="ba68f40d-f301-40d2-a0ba-1247f2c4600a"
railway logs
```

---

## 💰 Cost

- **Free Tier**: $5/month credit (plenty for testing)
- **After free tier**: ~$10-20/month
- **No credit card needed** to start

---

## 🎉 You're Done!

Your Performance Management & Development System with AI is now **LIVE ON THE INTERNET**!

**All Features Included:**
- ✅ AI-powered competency suggestions
- ✅ Job description parser
- ✅ Behavioral indicator generation
- ✅ Goal/OKR recommendations
- ✅ Skill gap detection
- ✅ Individual Development Plans
- ✅ Sentiment analysis
- ✅ Learning path suggestions
- ✅ Complete REST API
- ✅ JWT authentication
- ✅ Role-based access control

**Questions?** Check the complete documentation in the repo.

---

**Need the URL again?**
```bash
export RAILWAY_TOKEN="ba68f40d-f301-40d2-a0ba-1247f2c4600a"
railway status
```
