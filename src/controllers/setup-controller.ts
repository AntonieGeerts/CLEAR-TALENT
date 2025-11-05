import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SetupController {
  /**
   * Push database schema (no migration files needed)
   */
  static async pushSchema(req: Request, res: Response) {
    try {
      const { databaseUrl } = req.body;
      const env = databaseUrl ? { ...process.env, DATABASE_URL: databaseUrl } : process.env;
      const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', { env });

      res.json({
        success: true,
        message: 'Schema pushed successfully',
        output: stdout,
        errors: stderr || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
        output: error.stdout,
        stderr: error.stderr,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Run database migrations
   */
  static async runMigrations(req: Request, res: Response) {
    try {
      const { databaseUrl } = req.body;
      const env = databaseUrl ? { ...process.env, DATABASE_URL: databaseUrl } : process.env;
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', { env });

      res.json({
        success: true,
        message: 'Migrations completed',
        output: stdout,
        errors: stderr || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
        output: error.stdout,
        stderr: error.stderr,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Seed database
   */
  static async seedDatabase(req: Request, res: Response) {
    try {
      const { databaseUrl } = req.body;
      const env = databaseUrl ? { ...process.env, DATABASE_URL: databaseUrl } : process.env;
      const { stdout, stderr } = await execAsync('npx prisma db seed', { env });

      res.json({
        success: true,
        message: 'Database seeded',
        output: stdout,
        errors: stderr || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
        output: error.stdout,
        stderr: error.stderr,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Initialize database - push schema and seed
   */
  static async initializeDatabase(req: Request, res: Response) {
    try {
      const { databaseUrl } = req.body;
      const env = databaseUrl ? { ...process.env, DATABASE_URL: databaseUrl } : process.env;
      const results: any[] = [];

      // Push schema (no migration files needed)
      try {
        const { stdout: pushOutput } = await execAsync('npx prisma db push --accept-data-loss', { env });
        results.push({ step: 'schema_push', status: 'success', output: pushOutput });
      } catch (error: any) {
        results.push({
          step: 'schema_push',
          status: 'error',
          error: error.message,
          output: error.stdout
        });
        // If schema push fails, don't continue to seed
        return res.json({
          success: false,
          message: 'Database initialization failed at schema push',
          results,
          timestamp: new Date().toISOString(),
        });
      }

      // Run seed
      try {
        const { stdout: seedOutput } = await execAsync('npx prisma db seed', { env });
        results.push({ step: 'seed', status: 'success', output: seedOutput });
      } catch (error: any) {
        results.push({
          step: 'seed',
          status: 'error',
          error: error.message,
          output: error.stdout
        });
      }

      res.json({
        success: true,
        message: 'Database initialization completed',
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
