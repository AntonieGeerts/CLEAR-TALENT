import { Response } from 'express';
import { AuthRequest } from '../types';
import { ScoringSystemService } from '../services/scoring-system-service';
import { apiLogger } from '../utils/logger';

export class ScoringSystemController {
  /**
   * Get all scoring systems for the tenant
   */
  static async getAll(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;

    const systems = await ScoringSystemService.getAll(tenantId);

    res.json({
      success: true,
      data: systems,
    });
  }

  /**
   * Get a specific scoring system
   */
  static async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const system = await ScoringSystemService.getById(id, tenantId);

    res.json({
      success: true,
      data: system,
    });
  }

  /**
   * Get the default scoring system
   */
  static async getDefault(req: AuthRequest, res: Response) {
    const tenantId = req.tenant!.id;

    const system = await ScoringSystemService.getDefault(tenantId);

    res.json({
      success: true,
      data: system,
    });
  }

  /**
   * Create a custom scoring system
   */
  static async create(req: AuthRequest, res: Response) {
    const { systemId, name, description, config } = req.body;
    const tenantId = req.tenant!.id;

    if (!systemId || !name || !description || !config) {
      return res.status(400).json({
        success: false,
        error: 'systemId, name, description, and config are required',
      });
    }

    const system = await ScoringSystemService.create(tenantId, {
      systemId,
      name,
      description,
      config,
    });

    apiLogger.info('Scoring system created', {
      systemId: system.id,
      tenantId,
      name,
    });

    res.status(201).json({
      success: true,
      data: system,
    });
  }

  /**
   * Update a scoring system
   */
  static async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { name, description, config, isActive } = req.body;
    const tenantId = req.tenant!.id;

    const system = await ScoringSystemService.update(id, tenantId, {
      name,
      description,
      config,
      isActive,
    });

    apiLogger.info('Scoring system updated', {
      systemId: id,
      tenantId,
    });

    res.json({
      success: true,
      data: system,
    });
  }

  /**
   * Set a scoring system as the default
   */
  static async setDefault(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    const system = await ScoringSystemService.setDefault(id, tenantId);

    apiLogger.info('Default scoring system updated', {
      systemId: id,
      tenantId,
    });

    res.json({
      success: true,
      data: system,
      message: 'Default scoring system updated successfully',
    });
  }

  /**
   * Delete a scoring system
   */
  static async delete(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const tenantId = req.tenant!.id;

    await ScoringSystemService.delete(id, tenantId);

    apiLogger.info('Scoring system deleted', {
      systemId: id,
      tenantId,
    });

    res.json({
      success: true,
      message: 'Scoring system deleted successfully',
    });
  }

  /**
   * Calculate score using a scoring system
   */
  static async calculateScore(req: AuthRequest, res: Response) {
    const { systemId } = req.params;
    const { questionScores } = req.body;
    const tenantId = req.tenant!.id;

    if (!questionScores || !Array.isArray(questionScores)) {
      return res.status(400).json({
        success: false,
        error: 'questionScores array is required',
      });
    }

    const result = await ScoringSystemService.calculateScore(
      systemId,
      tenantId,
      questionScores
    );

    res.json({
      success: true,
      data: result,
    });
  }
}
