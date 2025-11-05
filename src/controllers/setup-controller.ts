import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SetupController {
  /**
   * Run database migrations
   */
  static async runMigrations(req: Request, res: Response) {
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

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
      const { stdout, stderr } = await execAsync('npx prisma db seed');

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
   * Initialize database - run migrations and seed
   */
  static async initializeDatabase(req: Request, res: Response) {
    try {
      const results = [];

      // Run migrations
      try {
        const { stdout: migrateOutput } = await execAsync('npx prisma migrate deploy');
        results.push({ step: 'migrations', status: 'success', output: migrateOutput });
      } catch (error: any) {
        results.push({
          step: 'migrations',
          status: 'error',
          error: error.message,
          output: error.stdout
        });
      }

      // Run seed
      try {
        const { stdout: seedOutput } = await execAsync('npx prisma db seed');
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
