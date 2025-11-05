# 🚀 Deploy CLEAR-TALENT Now

**You have AWS + GitHub access. Let's get you deployed in 15 minutes!**

---

## 📊 Choose Your Deployment Method

| Method | Time | Cost/Month | Difficulty | Best For |
|--------|------|------------|------------|----------|
| **Railway** | 10 min | $5 | ⭐ Easy | Quick start, prototyping |
| **AWS EB** | 15 min | $46 | ⭐⭐ Medium | Production, full control |
| **Docker** | 5 min | $0 | ⭐ Easy | Your own server |

---

## 🎯 What You Need

### Required (Get These First):
- ✅ **OpenAI API Key** → https://platform.openai.com/api-keys
- ✅ **AWS Account** (you have this)
- ✅ **GitHub** (you have this)

### Your Code Location:
```
GitHub: AntonieGeerts/CLEAR-TALENT
Branch: claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK
```

---

## 🚀 Option 1: Railway (RECOMMENDED - Easiest)

**Time: 10 minutes | Cost: $5/month**

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

### Step 2: Run Deployment Script
```bash
cd /home/user/CLEAR-TALENT
chmod +x deploy-railway.sh
./deploy-railway.sh
```

The script will:
- Install Railway CLI
- Login to Railway (opens browser)
- Create new project
- Add PostgreSQL with pgvector
- Set environment variables
- Deploy application
- Run migrations
- Give you the URL

### What You'll See:
```
🚀 CLEAR-TALENT Railway Deployment
====================================

Railway CLI version: 3.x.x

Enter your OpenAI API Key: sk-...
Generating secure JWT secret...
✅ JWT Secret generated

================================
Starting Railway deployment...
================================

1️⃣  Logging into Railway...
   (A browser window will open)
```

### After Deployment:
```bash
# Your URL will be something like:
https://clear-talent-production.up.railway.app

# Test it:
curl https://your-url.railway.app/api/v1/health

# Login:
curl -X POST https://your-url.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo-org.com","password":"admin123"}'
```

**✅ Done! Your app is live!**

---

## 🔧 Option 2: AWS Elastic Beanstalk (Full Control)

**Time: 15 minutes | Cost: ~$46/month**

### Step 1: Install AWS Tools

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install EB CLI
pip3 install --user awsebcli
export PATH=$PATH:~/.local/bin

# Verify
aws --version
eb --version
```

### Step 2: Configure AWS
```bash
aws configure
```

Enter:
- **AWS Access Key ID**: [Your AWS Access Key]
- **AWS Secret Access Key**: [Your AWS Secret]
- **Default region**: us-east-1 (or your preferred region)
- **Default output format**: json

### Step 3: Run Deployment Script
```bash
cd /home/user/CLEAR-TALENT
chmod +x deploy-aws.sh
./deploy-aws.sh
```

The script will ask you for:
- OpenAI API Key
- Application name (default: clear-talent)
- Environment name (default: clear-talent-prod)
- AWS region (default: us-east-1)

### What It Does:
1. Creates Elastic Beanstalk application
2. Creates environment with PostgreSQL RDS
3. Deploys Docker container
4. Sets up environment variables
5. Enables pgvector extension
6. Runs database migrations

### After Deployment:
```bash
# Your URL will be:
http://clear-talent-prod.us-east-1.elasticbeanstalk.com

# View status:
eb status

# View logs:
eb logs

# Open in browser:
eb open
```

**✅ Done! Your app is on AWS!**

---

## 💻 Option 3: Docker (Your Own Server)

**Time: 5 minutes | Cost: $0 (just server cost)**

### Prerequisites:
- A server/VPS with Docker installed
- SSH access to your server

### Step 1: On Your Server
```bash
# Clone repository
git clone https://github.com/AntonieGeerts/CLEAR-TALENT.git
cd CLEAR-TALENT

# Checkout the correct branch
git checkout claude/pmds-ai-integration-spec-011CUpBsf5uHdFbpouYDsSWK
```

### Step 2: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Set these values:
```env
DATABASE_URL=postgresql://postgres:yourpassword@postgres:5432/clear_talent?schema=public
JWT_SECRET=your-generated-secret-here
OPENAI_API_KEY=sk-your-openai-key-here
AI_ENABLED=true
```

Generate JWT Secret:
```bash
openssl rand -hex 32
```

### Step 3: Deploy with Docker Compose
```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Optional: Seed demo data
docker-compose exec app npx prisma db seed
```

### Step 4: Test
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Or access via server IP:
curl http://YOUR_SERVER_IP:3000/api/v1/health
```

### Setup Nginx (Optional - for production):
```bash
# Install Nginx
sudo apt update
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/clear-talent
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/clear-talent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**✅ Done! Your app is running on Docker!**

---

## 🧪 Testing Your Deployment

### 1. Health Check
```bash
curl https://your-domain.com/api/v1/health
```

Expected:
```json
{
  "success": true,
  "message": "CLEAR-TALENT API is running",
  "version": "0.2.0",
  "stage": "Stage 2 - AI-Assisted Workflows"
}
```

### 2. Login
```bash
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo-org.com",
    "password": "admin123"
  }'
```

Save the `token` from response.

### 3. Test AI Feature
```bash
# Improve text
curl -X POST https://your-domain.com/api/v1/ai/text/improve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Employee did good work.",
    "context": "performance review",
    "style": "specific"
  }'
```

### 4. Test Stage 2 Feature
```bash
# Suggest goals
curl -X POST https://your-domain.com/api/v1/workflows/goals/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roleProfileId": "ROLE_ID",
    "context": {
      "careerAspirations": "Become a team lead"
    }
  }'
```

---

## 🔐 Security Checklist

After deployment, immediately:

```bash
# 1. Change default admin password
# Login and change password via API or create new admin

# 2. Update CORS settings
# Edit .env or environment variables:
CORS_ORIGIN=https://your-frontend-domain.com

# 3. Enable HTTPS
# AWS: Use AWS Certificate Manager
# Railway: Automatic HTTPS
# Docker: Use Let's Encrypt with Nginx
```

---

## 📊 What You Get

After deployment, you'll have:

### ✅ Stage 1 Features:
- AI Competency Library
- AI JD Parser
- AI Behavioral Indicators
- AI Text Improvement
- Security & Audit Logs

### ✅ Stage 2 Features:
- Role Templates
- AI Goal/OKR Suggestions
- Skill Gap Detection
- AI-Generated IDPs
- Sentiment Analysis
- Learning Paths

### ✅ Infrastructure:
- PostgreSQL with pgvector
- Docker containerization
- Health monitoring
- Audit logging
- Rate limiting
- PII protection

---

## 💰 Cost Breakdown

### Railway
- **Starter**: $5/month
- **Scaling**: $20/month
- **Includes**: PostgreSQL, automatic HTTPS, easy scaling

### AWS Elastic Beanstalk
- **t3.small**: ~$30/month
- **RDS db.t3.micro**: ~$15/month
- **Load Balancer**: ~$20/month (if needed)
- **Total**: ~$46-65/month

### Docker (Your Server)
- **DigitalOcean**: $12/month (2GB RAM)
- **AWS EC2**: $20/month (t3.small)
- **Linode**: $12/month (Nanode 2GB)

---

## 🆘 Troubleshooting

### "Database connection failed"
```bash
# Railway:
railway variables get DATABASE_URL

# AWS:
eb printenv | grep DATABASE_URL

# Docker:
docker-compose logs postgres
```

### "OpenAI API error"
```bash
# Check your key is valid:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"
```

### "pgvector extension not found"
```sql
-- Connect to database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

### View Logs
```bash
# Railway:
railway logs

# AWS:
eb logs

# Docker:
docker-compose logs -f app
```

---

## 🎯 Next Steps

1. **Deploy** (choose one method above)
2. **Test** (use curl commands above)
3. **Secure** (change passwords, set CORS)
4. **Use** (start creating competencies)
5. **Build Frontend** (connect to your API)

---

## 📚 Documentation

- **API_EXAMPLES.md** - Stage 1 API usage
- **STAGE2_EXAMPLES.md** - Stage 2 API usage
- **DEPLOYMENT.md** - Detailed deployment guide
- **ARCHITECTURE.md** - System architecture

---

## 🎉 Ready to Deploy?

Pick your method and run the script:

```bash
# Railway (Easiest)
./deploy-railway.sh

# AWS (Full Control)
./deploy-aws.sh

# Docker (Your Server)
docker-compose up -d
```

**Your PMDS AI system will be live in 10-15 minutes!** 🚀
