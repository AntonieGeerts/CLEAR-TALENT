import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger, { apiLogger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { globalRateLimiter } from './middleware/rate-limit';

const app = express();

// Trust proxy - required for Railway/Heroku and other reverse proxies
// This enables proper IP detection for rate limiting
app.set('trust proxy', true);

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
