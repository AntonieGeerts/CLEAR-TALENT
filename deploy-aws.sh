#!/bin/bash

# CLEAR-TALENT AWS Deployment Script
# This script will deploy your PMDS application to AWS Elastic Beanstalk

set -e  # Exit on error

echo "🚀 CLEAR-TALENT AWS Deployment"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found${NC}"
        echo "Install with: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && sudo ./aws/install"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI installed${NC}"

    # Check EB CLI
    if ! command -v eb &> /dev/null; then
        echo -e "${YELLOW}⚠️  EB CLI not found. Installing...${NC}"
        pip3 install --user awsebcli
        export PATH=$PATH:~/.local/bin
    fi
    echo -e "${GREEN}✅ EB CLI installed${NC}"

    # Check if AWS is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not configured${NC}"
        echo "Run: aws configure"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI configured${NC}"
}

# Get user inputs
get_inputs() {
    echo ""
    echo "📝 Configuration"
    echo "================================"

    # OpenAI API Key
    read -p "Enter your OpenAI API Key: " OPENAI_KEY
    if [ -z "$OPENAI_KEY" ]; then
        echo -e "${RED}❌ OpenAI API Key is required${NC}"
        exit 1
    fi

    # Generate JWT Secret
    echo "Generating JWT Secret..."
    JWT_SECRET=$(openssl rand -hex 32)
    echo -e "${GREEN}✅ JWT Secret generated${NC}"

    # App name
    read -p "Enter application name (default: clear-talent): " APP_NAME
    APP_NAME=${APP_NAME:-clear-talent}

    # Environment name
    read -p "Enter environment name (default: ${APP_NAME}-prod): " ENV_NAME
    ENV_NAME=${ENV_NAME:-${APP_NAME}-prod}

    # Region
    read -p "Enter AWS region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}

    echo ""
    echo "Configuration:"
    echo "  App Name: $APP_NAME"
    echo "  Environment: $ENV_NAME"
    echo "  Region: $AWS_REGION"
    echo "  OpenAI Key: ${OPENAI_KEY:0:10}..."
    echo "  JWT Secret: ${JWT_SECRET:0:10}..."
    echo ""
    read -p "Continue? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
}

# Initialize Elastic Beanstalk
init_eb() {
    echo ""
    echo "🔧 Initializing Elastic Beanstalk..."

    if [ ! -f ".elasticbeanstalk/config.yml" ]; then
        eb init -p docker $APP_NAME --region $AWS_REGION
        echo -e "${GREEN}✅ EB initialized${NC}"
    else
        echo -e "${YELLOW}⚠️  EB already initialized${NC}"
    fi
}

# Create environment
create_environment() {
    echo ""
    echo "🏗️  Creating environment..."
    echo "This will take 5-10 minutes..."

    eb create $ENV_NAME \
        --database.engine postgres \
        --database.version 15 \
        --database.username ebroot \
        --instance-type t3.small \
        --region $AWS_REGION

    echo -e "${GREEN}✅ Environment created${NC}"
}

# Set environment variables
set_env_vars() {
    echo ""
    echo "⚙️  Setting environment variables..."

    # Get database URL from EB
    DB_HOST=$(eb printenv | grep RDS_HOSTNAME | cut -d'=' -f2 | tr -d ' ')
    DB_PORT=$(eb printenv | grep RDS_PORT | cut -d'=' -f2 | tr -d ' ')
    DB_NAME=$(eb printenv | grep RDS_DB_NAME | cut -d'=' -f2 | tr -d ' ')
    DB_USER=$(eb printenv | grep RDS_USERNAME | cut -d'=' -f2 | tr -d ' ')
    DB_PASS=$(eb printenv | grep RDS_PASSWORD | cut -d'=' -f2 | tr -d ' ')

    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

    eb setenv \
        NODE_ENV=production \
        DATABASE_URL="$DATABASE_URL" \
        JWT_SECRET="$JWT_SECRET" \
        OPENAI_API_KEY="$OPENAI_KEY" \
        OPENAI_MODEL="gpt-4o-mini" \
        AI_ENABLED="true" \
        LOG_LEVEL="info"

    echo -e "${GREEN}✅ Environment variables set${NC}"
}

# Deploy application
deploy_app() {
    echo ""
    echo "🚀 Deploying application..."

    eb deploy

    echo -e "${GREEN}✅ Application deployed${NC}"
}

# Setup database
setup_database() {
    echo ""
    echo "🗄️  Setting up database..."
    echo "Enabling pgvector extension and running migrations..."

    # SSH into instance and setup
    eb ssh -c "sudo -u postgres psql -d ebdb -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
    eb ssh -c "cd /var/app/current && npx prisma migrate deploy"

    echo -e "${GREEN}✅ Database setup complete${NC}"
}

# Get application URL
get_url() {
    echo ""
    echo "🌐 Getting application URL..."
    APP_URL=$(eb status | grep "CNAME" | cut -d':' -f2 | tr -d ' ')
    echo ""
    echo "================================"
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo "================================"
    echo ""
    echo "Your application is available at:"
    echo -e "${GREEN}http://${APP_URL}${NC}"
    echo ""
    echo "API Health Check:"
    echo "  curl http://${APP_URL}/api/v1/health"
    echo ""
    echo "Demo Login:"
    echo "  Email: admin@demo-org.com"
    echo "  Password: admin123"
    echo ""
    echo "Next steps:"
    echo "  1. Test the health endpoint"
    echo "  2. Login with demo credentials"
    echo "  3. Change default password"
    echo "  4. Create your competencies"
    echo ""
}

# Main deployment flow
main() {
    check_prerequisites
    get_inputs
    init_eb
    create_environment
    set_env_vars
    deploy_app
    setup_database
    get_url
}

# Run main function
main
