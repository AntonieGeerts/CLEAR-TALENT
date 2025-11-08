import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger, { apiLogger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { globalRateLimiter } from './middleware/rate-limit';
import { backfillLegacyMemberships, seedAccessControl } from './lib/access-control-bootstrap';

const app = express();

// Trust proxy - Railway uses a single reverse proxy
// Trust only the first proxy hop for security (prevents IP spoofing)
// See: https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(globalRateLimiter);

// Request logging
app.use((req, res, next) => {
  apiLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// API routes
app.use(`/api/${config.apiVersion}`, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CLEAR-TALENT API',
    version: config.apiVersion,
    documentation: '/api/v1/health',
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Auto-initialize database
async function initializeDatabase() {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Fix failed migrations and ensure enum values exist
    try {
      logger.info('🔍 Checking for migration issues...');

      // Delete any failed migration records that are blocking new migrations
      const deletedCount = await prisma.$executeRawUnsafe(`
        DELETE FROM "_prisma_migrations"
        WHERE migration_name = '20251106054341_add_unique_constraint_to_competencies'
        AND finished_at IS NULL;
      `);

      if (deletedCount > 0) {
        logger.info(`✅ Removed ${deletedCount} failed migration record(s)`);
      }

      // Ensure all CompetencyType enum values exist
      logger.info('📝 Ensuring CompetencyType enum values...');

      // Try to add each enum value - PostgreSQL 9.1+ supports IF NOT EXISTS
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'CORE';`);
        logger.info('✅ CORE value ensured');
      } catch (e: any) {
        logger.warn(`CORE value: ${e.message}`);
      }

      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'LEADERSHIP';`);
        logger.info('✅ LEADERSHIP value ensured');
      } catch (e: any) {
        logger.warn(`LEADERSHIP value: ${e.message}`);
      }

      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'FUNCTIONAL';`);
        logger.info('✅ FUNCTIONAL value ensured');
      } catch (e: any) {
        logger.warn(`FUNCTIONAL value: ${e.message}`);
      }

      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'TECHNICAL';`);
        logger.info('✅ TECHNICAL value ensured');
      } catch (e: any) {
        logger.warn(`TECHNICAL value: ${e.message}`);
      }

      logger.info('✅ Migration fixes applied successfully');
    } catch (migrationError: any) {
      logger.warn(`⚠️  Migration fix warning: ${migrationError.message}`);
      // Don't fail startup if migration fix fails - let the app try to start anyway
    }

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      logger.info('🌱 No users found - initializing database...');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      try {
        await execAsync('npx prisma db seed');
        logger.info('✅ Database seeded successfully');
      } catch (err: any) {
        logger.warn(`⚠️  Seed warning: ${err.message}`);
      }
    } else {
      logger.info(`✅ Database ready (${userCount} users found)`);
    }

    try {
      await seedAccessControl(prisma, message => logger.info(`🔐 ${message}`));
    } catch (seedError: any) {
      logger.error('Failed to ensure access control defaults', {
        error: seedError.message,
      });
    }

    try {
      const created = await backfillLegacyMemberships(prisma);
      if (created === 0) {
        logger.info('✅ Tenant memberships already in sync');
      }
    } catch (membershipError: any) {
      logger.error('Failed to backfill tenant memberships', {
        error: membershipError.message,
      });
    }

    await prisma.$disconnect();
  } catch (error: any) {
    logger.error(`Database check failed: ${error.message}`);
  }
}

// Start server
const server = app.listen(config.port, async () => {
  logger.info(`🚀 Server started`, {
    port: config.port,
    env: config.env,
    apiVersion: config.apiVersion,
  });
  logger.info(`📍 API available at http://localhost:${config.port}/api/${config.apiVersion}`);

  // Initialize database
  await initializeDatabase();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
