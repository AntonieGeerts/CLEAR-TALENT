#!/bin/bash
# Railway Deployment Script for CLEAR-TALENT PMDS
# Run this on your local machine after cloning the repo

set -e  # Exit on error

echo "=========================================="
echo "🚂 CLEAR-TALENT Railway Deployment"
echo "=========================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

echo ""
echo "📝 Step 1: Login to Railway (browser will open)"
echo "   Create a free account if you don't have one"
read -p "Press Enter to continue..."
railway login

echo ""
echo "📝 Step 2: Initialize Railway project"
railway init

echo ""
echo "📝 Step 3: Add PostgreSQL database"
railway add -d postgres

echo ""
echo "📝 Step 4: Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=8080
railway variables set JWT_SECRET=YOUR_JWT_SECRET_HERE
railway variables set OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
railway variables set OPENAI_MODEL=gpt-4o-mini
railway variables set AI_ENABLED=true
railway variables set LOG_LEVEL=info

echo "✅ Environment variables set"

echo ""
echo "📝 Step 5: Deploying application..."
echo "   This will build your Docker image and deploy it"
railway up

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 30

echo ""
echo "📝 Step 6: Setting up database..."
echo "   Enabling pgvector extension..."
railway run sh -c 'echo "CREATE EXTENSION IF NOT EXISTS vector;" | psql $DATABASE_URL' || echo "⚠️  Extension may already exist"

echo ""
echo "   Running Prisma migrations..."
railway run npx prisma migrate deploy

echo ""
echo "   Seeding database with demo data..."
railway run npx prisma db seed

echo ""
echo "📝 Step 7: Generating public domain..."
railway domain

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📋 Your application is now live!"
echo ""
echo "To get your URL, run:"
echo "  railway status"
echo ""
echo "Or open in browser:"
echo "  railway open"
echo ""
echo "Demo Login Credentials:"
echo "  Email: admin@demo-org.com"
echo "  Password: admin123"
echo ""
echo "Test your API:"
echo '  curl https://your-url.up.railway.app/api/v1/health'
echo ""
