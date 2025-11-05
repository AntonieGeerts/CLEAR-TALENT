# CLEAR-TALENT Setup Guide

## Quick Start

### Prerequisites

1. **Node.js 18+** and **npm 9+**
   ```bash
   node --version  # Should be >= 18
   npm --version   # Should be >= 9
   ```

2. **PostgreSQL 15+** with **pgvector extension**
   ```bash
   psql --version  # Should be >= 15
   ```

3. **OpenAI API Key**
   - Sign up at https://platform.openai.com
   - Create an API key from the API keys section

### Installation Steps

#### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd CLEAR-TALENT
npm install
```

#### 2. Set Up PostgreSQL Database

```bash
# Create database
createdb clear_talent

# Connect to database and enable pgvector
psql clear_talent

# In psql:
CREATE EXTENSION IF NOT EXISTS vector;
\q
```

#### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/clear_talent?schema=public"

# JWT (Change this to a secure random string!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# AI Configuration
AI_ENABLED=true
```

**Important**: Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with demo data
npm run prisma:seed
```

#### 5. Start the Development Server

```bash
npm run dev
```

The API will be available at: `http://localhost:3000/api/v1`

---

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "CLEAR-TALENT API is running",
  "timestamp": "2025-11-05T...",
  "version": "0.1.0"
}
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo-org.com",
    "password": "admin123"
  }'
```

Save the `token` from the response for subsequent requests.

### 3. Test AI Features

#### Suggest Competencies from Job Description

```bash
curl -X POST http://localhost:3000/api/v1/ai/competencies/suggest-from-jd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "jobDescription": "We are looking for a Senior Software Engineer with 5+ years of experience in backend development. Must have strong skills in Node.js, PostgreSQL, and API design. Should be able to mentor junior developers and lead technical discussions.",
    "roleTitle": "Senior Software Engineer",
    "department": "Engineering"
  }'
```

#### Improve Review Text

```bash
curl -X POST http://localhost:3000/api/v1/ai/text/improve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "text": "John did a good job on the project.",
    "context": "performance review",
    "style": "specific"
  }'
```

---

## Default Users

After running the seed script, you'll have these demo users:

| Email | Password | Role |
|-------|----------|------|
| admin@demo-org.com | admin123 | ADMIN |
| hr@demo-org.com | hr123 | HR_MANAGER |

---

## Database Management

### View Database in GUI

```bash
npm run prisma:studio
```

Opens Prisma Studio at http://localhost:5555

### Create a New Migration

```bash
# After modifying prisma/schema.prisma
npm run prisma:migrate
```

### Reset Database (WARNING: Deletes all data)

```bash
npx prisma migrate reset
```

---

## Development Workflow

### Run in Development Mode (with auto-reload)

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

### Run Tests

```bash
npm test
```

### Lint Code

```bash
npm run lint
npm run lint:fix
```

### Format Code

```bash
npm run format
```

---

## Troubleshooting

### Error: "OpenAI API key is required"

Make sure `OPENAI_API_KEY` is set in your `.env` file.

### Error: "P1001: Can't reach database server"

- Check that PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env` is correct
- Ensure the database exists: `psql -l | grep clear_talent`

### Error: "relation does not exist"

Run migrations:
```bash
npm run prisma:migrate
```

### Error: "vector type does not exist"

Enable pgvector extension:
```bash
psql clear_talent -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Rate Limiting Issues

If you're hitting rate limits during testing, you can temporarily increase them in `.env`:

```env
RATE_LIMIT_MAX_REQUESTS=1000
AI_RATE_LIMIT_PER_MINUTE=100
```

---

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production` in environment variables
2. Use a managed PostgreSQL database (AWS RDS, Azure Database, GCP Cloud SQL)
3. Store secrets securely (AWS Secrets Manager, Azure Key Vault, etc.)
4. Set up proper logging and monitoring
5. Configure CORS for your frontend domain

### Security Checklist

- [ ] Change JWT_SECRET to a secure random string
- [ ] Update default admin passwords
- [ ] Configure proper CORS_ORIGIN
- [ ] Enable HTTPS/TLS
- [ ] Set up rate limiting appropriate for your load
- [ ] Configure proper backup strategy
- [ ] Set up monitoring and alerting
- [ ] Review and test PII redaction

### Recommended Infrastructure

```
┌─────────────┐
│   CDN/LB    │
└──────┬──────┘
       │
┌──────▼──────┐
│   App       │ (Auto-scaling)
│ Containers  │
└──────┬──────┘
       │
┌──────▼──────────────────┐
│  Managed PostgreSQL     │
│  + pgvector extension   │
└─────────────────────────┘
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t clear-talent .
docker run -p 3000:3000 --env-file .env clear-talent
```

---

## Next Steps

1. **Explore the API**: Check out the full API documentation in README.md
2. **Customize Prompts**: Modify AI prompt templates in the database or via API
3. **Add Users**: Create additional users via the register endpoint
4. **Build Frontend**: Connect your frontend application to the API
5. **Implement Stage 2**: Add performance review workflows, goals, and analytics

---

## Support

For issues or questions:
- Check the logs in `./logs/` directory
- Review the architecture in `ARCHITECTURE.md`
- Open an issue on GitHub

---

## License

MIT License - see LICENSE file for details
