import { Response } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth/auth-service';
import { LoginInput, RegisterInput } from '../utils/validators';

export class AuthController {
  /**
   * Login
   */
  static async login(req: AuthRequest, res: Response) {
    const { email, password } = req.body as LoginInput;

    const result = await AuthService.login(email, password);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Register (admin only in production, open for demo)
   */
  static async register(req: AuthRequest, res: Response) {
    const { email, password, firstName, lastName, department, position } = req.body as RegisterInput;

    // Use the first tenant (demo org) or require tenantId
    const tenantId = req.tenant?.id || req.body.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID is required',
      });
    }

    const user = await AuthService.register(
      email,
      password,
      firstName,
      lastName,
      tenantId,
      department,
      position
    );

    res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current user
   */
  static async me(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const user = await AuthService.getUserById(req.user.id);

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Refresh token
   */
  static async refresh(req: AuthRequest, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logout (client-side token removal)
   */
  static async logout(req: AuthRequest, res: Response) {
    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    });
  }
}

export default AuthController;
