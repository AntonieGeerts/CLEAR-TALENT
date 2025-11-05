# Use Node.js 18 Alpine
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy application files
COPY tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src/

# Build TypeScript (without Prisma generate - will do at runtime)
RUN npm run build || true

# Create logs directory
RUN mkdir -p /app/logs

# Set environment
ENV NODE_ENV=production

# Expose port 8080 for Elastic Beanstalk
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Start script that generates Prisma client and starts the app
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"]
