# CLEAR-TALENT Deployment Guide

Comprehensive guide for deploying CLEAR-TALENT to various platforms.

## Table of Contents

- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Railway Deployment](#railway-deployment)
- [Render Deployment](#render-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Monitoring & Logging](#monitoring--logging)

---

## Docker Deployment

### Local Development with Docker Compose

```bash
# 1. Create .env file
cp .env.example .env

# 2. Edit .env with your secrets
# Required: JWT_SECRET, OPENAI_API_KEY

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f app

# 5. Run migrations (first time only)
docker-compose exec app npx prisma migrate deploy

# 6. Seed database (optional)
docker-compose exec app npx prisma db seed

# 7. Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build image
docker build -t clear-talent:latest .

# Run with environment file
docker run -d \
  --name clear-talent \
  -p 3000:3000 \
  --env-file .env \
  clear-talent:latest

# Or with inline environment variables
docker run -d \
  --name clear-talent \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  -e OPENAI_API_KEY="sk-..." \
  clear-talent:latest
```

---

## AWS Deployment

### Option 1: AWS Elastic Beanstalk

#### Prerequisites
- AWS CLI installed and configured
- EB CLI installed (`pip install awsebcli`)

#### Steps

```bash
# 1. Initialize Elastic Beanstalk
eb init -p docker clear-talent

# 2. Create environment
eb create clear-talent-prod \
  --database.engine postgres \
  --database.version 15 \
  --instance-type t3.small

# 3. Set environment variables
eb setenv \
  NODE_ENV=production \
  JWT_SECRET="your-secret-here" \
  OPENAI_API_KEY="sk-your-key" \
  AI_ENABLED=true

# 4. Deploy
eb deploy

# 5. Open in browser
eb open

# 6. View logs
eb logs
```

#### Database Setup (Post-deployment)
```bash
# SSH into instance
eb ssh

# Enable pgvector
sudo -u postgres psql -d ebdb -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
cd /var/app/current
npx prisma migrate deploy
```

### Option 2: AWS ECS (Fargate)

#### Using AWS Console

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name clear-talent
   ```

2. **Build and Push Image**
   ```bash
   # Login to ECR
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

   # Build
   docker build -t clear-talent .

   # Tag
   docker tag clear-talent:latest \
     YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/clear-talent:latest

   # Push
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/clear-talent:latest
   ```

3. **Create RDS PostgreSQL Database**
   - Engine: PostgreSQL 15+
   - Enable pgvector: Connect and run `CREATE EXTENSION vector;`
   - Note connection string

4. **Create ECS Cluster**
   - Launch type: Fargate
   - Create task definition with your ECR image
   - Set environment variables (use Secrets Manager for sensitive data)
   - Configure port 3000

5. **Create Service**
   - Load balancer: Application Load Balancer
   - Target group: HTTP 3000
   - Health check: `/api/v1/health`

### Option 3: AWS Lambda + API Gateway (Serverless)

For serverless deployment, you'll need to adapt the Express app. Consider using:
- AWS Serverless Express or Serverless Framework
- Aurora Serverless v2 (PostgreSQL)

---

## Railway Deployment

Railway is the easiest deployment option with built-in PostgreSQL + pgvector.

### Steps

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Add PostgreSQL**
   ```bash
   railway add postgresql
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set JWT_SECRET="your-secret"
   railway variables set OPENAI_API_KEY="sk-your-key"
   railway variables set AI_ENABLED="true"
   ```

6. **Deploy**
   ```bash
   railway up
   ```

7. **Enable pgvector**
   ```bash
   # Get database connection string
   railway variables get DATABASE_URL

   # Connect and enable extension
   psql "YOUR_DATABASE_URL"
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

8. **Run Migrations**
   ```bash
   railway run npx prisma migrate deploy
   ```

9. **Get Domain**
   ```bash
   railway domain
   ```

### Railway Dashboard Method

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add PostgreSQL service
5. Set environment variables in Settings
6. Railway will auto-deploy on git push

---

## Render Deployment

### Prerequisites
- GitHub/GitLab repository
- Render account

### Steps

1. **Create PostgreSQL Database**
   - Go to Render Dashboard
   - New → PostgreSQL
   - Choose plan and region
   - Note connection details

2. **Enable pgvector**
   ```bash
   # Connect via psql
   psql "YOUR_RENDER_POSTGRES_URL"
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Create Web Service**
   - New → Web Service
   - Connect your repository
   - Settings:
     - **Environment**: Docker
     - **Region**: Same as database
     - **Instance Type**: Starter or higher
     - **Docker Command**: (leave default)

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=YOUR_RENDER_POSTGRES_URL
   JWT_SECRET=your-secret-here
   OPENAI_API_KEY=sk-your-key
   AI_ENABLED=true
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - URL will be `https://your-app.onrender.com`

6. **Run Migrations**
   ```bash
   # In Render shell or manually
   npx prisma migrate deploy
   ```

### Auto-Deploy on Push
- Enable "Auto-Deploy" in Render settings
- Every git push to main will trigger deployment

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT signing | `random-64-char-string` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3000` | Server port |
| `OPENAI_MODEL` | `gpt-4o-mini` | AI model to use |
| `AI_ENABLED` | `true` | Enable/disable AI |
| `LOG_LEVEL` | `info` | Logging level |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origins |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Rate limit |
| `AI_RATE_LIMIT_PER_MINUTE` | `60` | AI rate limit |

### Generating JWT Secret

```bash
# Method 1: OpenSSL
openssl rand -hex 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Database Setup

### PostgreSQL with pgvector

#### Installation

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-15 postgresql-15-pgvector
```

**macOS:**
```bash
brew install postgresql@15 pgvector
```

**Docker:**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  ankane/pgvector:latest
```

#### Enable Extension

```sql
-- Connect to your database
psql -U postgres -d clear_talent

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
\dx
```

### Managed Database Options

| Provider | Service | pgvector Support |
|----------|---------|------------------|
| AWS | RDS PostgreSQL 15+ | ✅ Available |
| GCP | Cloud SQL PostgreSQL | ✅ Available |
| Azure | Azure Database PostgreSQL | ✅ Available |
| Railway | Managed PostgreSQL | ✅ Built-in |
| Render | Managed PostgreSQL | ✅ Built-in |
| Supabase | PostgreSQL | ✅ Built-in |

### Migrations

```bash
# Development: Create and apply migration
npm run prisma:migrate

# Production: Apply existing migrations
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

---

## Monitoring & Logging

### Application Logs

Logs are written to:
- Console (stdout/stderr)
- `./logs/combined.log`
- `./logs/error.log`

### Health Check Endpoint

```bash
curl https://your-domain.com/api/v1/health
```

Response:
```json
{
  "success": true,
  "message": "CLEAR-TALENT API is running",
  "version": "0.2.0",
  "stage": "Stage 2 - AI-Assisted Workflows"
}
```

### Monitoring Tools

**Recommended:**
- **Sentry**: Error tracking
- **Datadog**: Full observability
- **New Relic**: APM
- **LogRocket**: User session replay
- **Grafana + Prometheus**: Metrics

**AWS CloudWatch** (for AWS deployments):
```bash
# View logs
aws logs tail /aws/elasticbeanstalk/clear-talent-prod --follow

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --metric-name 5XXError \
  --threshold 10
```

### Database Monitoring

```sql
-- Check database connections
SELECT count(*) FROM pg_stat_activity;

-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables
WHERE schemaname = 'public';

-- Long running queries
SELECT pid, age(clock_timestamp(), query_start), query
FROM pg_stat_activity
WHERE state != 'idle'
AND query_start IS NOT NULL
ORDER BY age DESC;
```

---

## Security Checklist

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/TLS in production
- [ ] Configure `CORS_ORIGIN` for your frontend domain
- [ ] Set up rate limiting (already configured)
- [ ] Enable database backups
- [ ] Use managed secrets (AWS Secrets Manager, etc.)
- [ ] Review PII redaction settings
- [ ] Set up monitoring and alerts
- [ ] Configure firewall rules
- [ ] Use least-privilege IAM roles (AWS)
- [ ] Keep dependencies updated

---

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (ALB, Nginx, etc.)
- Set `SESSION_SECRET` for consistent sessions
- Consider Redis for session storage (future)
- Database connection pooling (Prisma handles this)

### Vertical Scaling

| Users | CPU | Memory | Database |
|-------|-----|--------|----------|
| < 100 | 1 vCPU | 2 GB | db.t3.micro |
| 100-1000 | 2 vCPU | 4 GB | db.t3.small |
| 1000-10k | 4 vCPU | 8 GB | db.t3.medium |
| 10k+ | 8+ vCPU | 16+ GB | db.m5.large+ |

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_competencies_tenant ON competencies(tenant_id);
CREATE INDEX idx_audit_logs_created ON ai_audit_logs(created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM competencies WHERE tenant_id = 'xxx';
```

---

## Troubleshooting

### Common Issues

**1. "Cannot connect to database"**
- Check `DATABASE_URL` is correct
- Ensure database is running
- Verify network/firewall rules

**2. "vector type does not exist"**
- Enable pgvector: `CREATE EXTENSION vector;`

**3. "OpenAI API rate limit"**
- Check API key and billing
- Increase `AI_RATE_LIMIT_PER_MINUTE`
- Consider caching responses

**4. "Out of memory"**
- Increase container/instance memory
- Check for memory leaks
- Optimize database queries

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG=*

# Check environment
node -e "console.log(process.env)"
```

---

## Cost Estimates

### AWS (us-east-1, monthly)

| Component | Type | Cost |
|-----------|------|------|
| ECS Fargate (1 task) | 0.25 vCPU, 0.5 GB | $10 |
| RDS PostgreSQL | db.t3.micro | $15 |
| ALB | Basic | $20 |
| Data Transfer | 10 GB | $1 |
| **Total** | | **~$46/month** |

### Railway

| Plan | Resources | Cost |
|------|-----------|------|
| Hobby | 512 MB RAM, $5 credit | $5/month |
| Starter | 8 GB RAM, PostgreSQL | $20/month |

### Render

| Plan | Resources | Cost |
|------|-----------|------|
| Starter | 512 MB RAM | $7/month |
| Standard | 2 GB RAM | $25/month |
| PostgreSQL | Included | Included |

---

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connection
4. Check health endpoint
5. Review this guide
6. Open GitHub issue with details

---

## License

MIT License - see LICENSE file
