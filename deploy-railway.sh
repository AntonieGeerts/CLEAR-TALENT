#!/bin/bash

# CLEAR-TALENT Railway Deployment Script
# Railway is the easiest deployment option (5-10 minutes)

set -e

echo "🚀 CLEAR-TALENT Railway Deployment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
fi

echo "Railway CLI version:"
railway --version
echo ""

# Get OpenAI API Key
read -p "Enter your OpenAI API Key: " OPENAI_KEY
if [ -z "$OPENAI_KEY" ]; then
    echo -e "${RED}❌ OpenAI API Key is required${NC}"
    echo "Get one at: https://platform.openai.com/api-keys"
    exit 1
fi

# Generate JWT Secret
echo "Generating secure JWT secret..."
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✅ JWT Secret generated${NC}"
echo ""

echo "================================"
echo "Starting Railway deployment..."
echo "================================"
echo ""

# Login to Railway
echo "1️⃣  Logging into Railway..."
echo "   (A browser window will open)"
railway login

# Initialize project
echo ""
echo "2️⃣  Initializing Railway project..."
railway init

# Add PostgreSQL
echo ""
echo "3️⃣  Adding PostgreSQL database (includes pgvector)..."
railway add -d postgres

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready (30 seconds)..."
sleep 30

# Set environment variables
echo ""
echo "4️⃣  Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set OPENAI_API_KEY="$OPENAI_KEY"
railway variables set OPENAI_MODEL="gpt-4o-mini"
railway variables set AI_ENABLED="true"
railway variables set LOG_LEVEL="info"

echo -e "${GREEN}✅ Environment variables set${NC}"

# Deploy application
echo ""
echo "5️⃣  Deploying application..."
echo "   (This will take 3-5 minutes)"
railway up

# Wait for deployment
echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 60

# Enable pgvector extension
echo ""
echo "6️⃣  Enabling pgvector extension..."
echo "   (You may need to enter database password)"
railway run bash -c "
export DB_URL=\$(railway variables get DATABASE_URL)
echo \"Connecting to database...\"
echo 'CREATE EXTENSION IF NOT EXISTS vector;' | railway run -- psql \$DATABASE_URL
"

# Run migrations
echo ""
echo "7️⃣  Running database migrations..."
railway run npx prisma migrate deploy

# Optional: Seed database
read -p "Do you want to seed the database with demo data? (y/n): " SEED
if [ "$SEED" = "y" ]; then
    echo "Seeding database..."
    railway run npx prisma db seed
    echo -e "${GREEN}✅ Database seeded${NC}"
fi

# Get domain
echo ""
echo "8️⃣  Getting application URL..."
APP_URL=$(railway domain)

echo ""
echo "================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo ""
echo "Your application is deployed!"
echo ""
echo "Application URL:"
echo -e "${GREEN}${APP_URL}${NC}"
echo ""
echo "Test the deployment:"
echo "  curl ${APP_URL}/api/v1/health"
echo ""
echo "Demo Login Credentials:"
echo "  Email: admin@demo-org.com"
echo "  Password: admin123"
echo ""
echo "Railway Dashboard:"
echo "  railway open"
echo ""
echo "View Logs:"
echo "  railway logs"
echo ""
echo "Next Steps:"
echo "  1. Test the health endpoint"
echo "  2. Login with demo credentials"
echo "  3. Change default passwords"
echo "  4. Set up your custom domain (optional)"
echo "  5. Start using AI features!"
echo ""
echo "Cost: Starting at \$5/month with \$5 free credit"
echo ""
