# 🚀 CLEAR-TALENT Quick Deploy Guide

**Version:** 0.2.0 (Stage 1 + Stage 2 Complete)

## ✅ What's Implemented

### Stage 1: AI Foundations
- AI Competency Library Builder
- AI JD Parser (suggest competencies from job descriptions)
- AI Behavioral Indicators Generator
- AI Review Text Helper (improve, summarize, rewrite)
- Complete security, logging, and audit trails

### Stage 2: AI-Assisted Workflows
- Role-Based Competency Templates with versioning
- AI Goal/OKR Suggestions
- AI Skill-Gap Detection
- AI-Generated Individual Development Plans (IDPs)
- Sentiment & Theme Extraction for Feedback
- Learning Path Suggestions

---

## 🎯 Choose Your Deployment Method

### Option 1: Railway (Recommended - Easiest)

**Time: 10 minutes**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL (includes pgvector)
railway add postgresql

# 5. Set environment variables
railway variables set JWT_SECRET="$(openssl rand -hex 32)"
railway variables set OPENAI_API_KEY="your-openai-key"
railway variables set AI_ENABLED="true"

# 6. Deploy
railway up

# 7. Enable pgvector extension
railway connect postgres
CREATE EXTENSION IF NOT EXISTS vector;
\q

# 8. Run migrations
railway run npx prisma migrate deploy

# 9. Get your URL
railway domain
```

**Cost:** Starting at $5/month with $5 free credit

---

### Option 2: Docker Compose (Local/VPS)

**Time: 5 minutes**

```bash
# 1. Clone repository
git clone <your-repo-url>
cd CLEAR-TALENT

# 2. Create .env file
cp .env.example .env

# Edit .env with your keys:
# - JWT_SECRET (generate with: openssl rand -hex 32)
# - OPENAI_API_KEY (from platform.openai.com)

# 3. Start everything
docker-compose up -d

# 4. Run migrations
docker-compose exec app npx prisma migrate deploy

# 5. Optional: Seed demo data
docker-compose exec app npx prisma db seed

# Access API at http://localhost:3000/api/v1
```

**Cost:** Free (your server/VPS cost)

---

### Option 3: AWS Elastic Beanstalk

**Time: 15 minutes**

```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init -p docker clear-talent

# 3. Create environment with PostgreSQL
eb create clear-talent-prod \
  --database.engine postgres \
  --database.version 15 \
  --instance-type t3.small

# 4. Set environment variables
eb setenv \
  JWT_SECRET="$(openssl rand -hex 32)" \
  OPENAI_API_KEY="your-key" \
  AI_ENABLED="true"

# 5. Deploy
eb deploy

# 6. Enable pgvector (SSH into instance)
eb ssh
sudo -u postgres psql -d ebdb -c "CREATE EXTENSION vector;"

# 7. Run migrations
eb ssh
cd /var/app/current
npx prisma migrate deploy
```

**Cost:** ~$46/month (can be reduced with reserved instances)

---

### Option 4: Render

**Time: 10 minutes**

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Create PostgreSQL database
   - Connect via psql and run: `CREATE EXTENSION vector;`
4. Create Web Service
   - Environment: Docker
   - Set environment variables:
     - `DATABASE_URL`: (from Render PostgreSQL)
     - `JWT_SECRET`: (generate with openssl)
     - `OPENAI_API_KEY`: (your key)
     - `AI_ENABLED`: `true`
5. Deploy automatically
6. Run migrations in Render Shell:
   ```bash
   npx prisma migrate deploy
   ```

**Cost:** Starting at $7/month

---

## 🔑 Required Environment Variables

```bash
# REQUIRED
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="generate-with-openssl-rand-hex-32"
OPENAI_API_KEY="sk-your-openai-api-key"

# OPTIONAL (with defaults)
NODE_ENV="production"
PORT="3000"
OPENAI_MODEL="gpt-4o-mini"
AI_ENABLED="true"
CORS_ORIGIN="https://your-frontend.com"
```

### Generate JWT Secret

```bash
# macOS/Linux
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🧪 Testing Your Deployment

### 1. Health Check

```bash
curl https://your-domain.com/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "CLEAR-TALENT API is running",
  "version": "0.2.0",
  "stage": "Stage 2 - AI-Assisted Workflows"
}
```

### 2. Login with Demo User

```bash
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo-org.com",
    "password": "admin123"
  }'
```

Save the token from response.

### 3. Test AI Feature

```bash
curl -X POST https://your-domain.com/api/v1/ai/text/improve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Employee did good work.",
    "context": "performance review",
    "style": "specific"
  }'
```

---

## 📊 What to Deploy Next

### Frontend Options

1. **React/Next.js Frontend**
   - Connect to API at `https://your-api-domain.com`
   - Use JWT tokens for authentication
   - See API_EXAMPLES.md for all endpoints

2. **Admin Dashboard**
   - Use Prisma Studio: `npx prisma studio`
   - Or build custom admin panel

3. **Mobile App**
   - Same API endpoints work for mobile
   - Use React Native or Flutter

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| **README.md** | Overview and quick start |
| **SETUP.md** | Detailed local setup |
| **DEPLOYMENT.md** | Comprehensive deployment guide |
| **API_EXAMPLES.md** | Stage 1 API examples |
| **STAGE2_EXAMPLES.md** | Stage 2 API examples |
| **ARCHITECTURE.md** | System architecture |

---

## 🔧 Common Issues & Solutions

### "Cannot connect to database"
- Verify `DATABASE_URL` is correct
- Check database is running
- Ensure network allows connection

### "vector type does not exist"
```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### "OpenAI API error"
- Check API key is valid
- Ensure billing is set up on OpenAI
- Verify API key has sufficient quota

### "Rate limit exceeded"
- Adjust rate limits in `.env`:
  ```
  RATE_LIMIT_MAX_REQUESTS=1000
  AI_RATE_LIMIT_PER_MINUTE=100
  ```

---

## 💰 Cost Comparison

| Platform | Starter | Medium | Large | Pros |
|----------|---------|--------|-------|------|
| **Railway** | $5/mo | $20/mo | $50/mo | Easiest setup, built-in DB |
| **Render** | $7/mo | $25/mo | $85/mo | Free tier, auto-deploy |
| **AWS EB** | $46/mo | $120/mo | $300/mo | Full control, scalable |
| **Docker** | $0 | $0 | $0 | Your VPS cost only |

---

## 🚦 Quick Deploy Checklist

- [ ] Choose deployment platform
- [ ] Set up PostgreSQL with pgvector
- [ ] Generate JWT_SECRET
- [ ] Get OpenAI API key
- [ ] Set environment variables
- [ ] Deploy application
- [ ] Run database migrations
- [ ] Test health endpoint
- [ ] Test login with demo user
- [ ] Test an AI feature
- [ ] Set up monitoring (optional)
- [ ] Configure custom domain (optional)

---

## 🎉 You're Ready!

Your PMDS with AI integration is now deployed and ready for:

1. **HR Teams**: Manage competencies and role profiles
2. **Managers**: AI-assisted performance reviews and goal setting
3. **Employees**: Development plans and learning paths
4. **Administrators**: Full system control and analytics

### Next Steps

1. Change default admin password
2. Create your organization's competencies
3. Set up role profiles
4. Invite your team
5. Start using AI features!

---

## 📞 Support

- **GitHub Issues**: For bugs and feature requests
- **Documentation**: See docs listed above
- **Community**: (Add your community links)

---

## 🔐 Security Reminder

Before going to production:

✅ Change default passwords
✅ Use strong JWT_SECRET
✅ Enable HTTPS/TLS
✅ Configure proper CORS
✅ Set up backups
✅ Review PII settings
✅ Enable monitoring

---

**Built with ❤️ for modern HR teams**

Version 0.2.0 - Stage 2 Complete
