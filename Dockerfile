# Use Node.js 18 Alpine
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache python3 make g++ postgresql-client openssl

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

# Generate Prisma client before build
RUN npx prisma generate

# Build TypeScript - MUST succeed
RUN npm run build

# Verify build output exists
RUN ls -la dist/

# Create logs directory
RUN mkdir -p /app/logs

# Set environment
ENV NODE_ENV=production

# Expose port 8080 for Elastic Beanstalk
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Start script with better error handling
CMD ["sh", "-c", "echo 'Generating Prisma client...' && npx prisma generate && echo 'Running migrations...' && npx prisma migrate deploy && echo 'Seeding database...' && npx prisma db seed || echo 'Seed failed or already seeded' && echo 'Starting application...' && node dist/index.js"]
