/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Session,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

// Auth API Controller (JSON Responses)
@Controller('api/auth')
export class AuthApiController {
  private readonly logger = new Logger(AuthApiController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Login and create session (JSON API)
   * Returns admin data and sets session cookie
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async loginAdmin(
    @Body() loginDto: LoginDto,
    @Session() session: Record<string, any>,
  ) {
    try {
      const admin = await this.authService.validateAdminCredentials(loginDto);

      // Store admin ID in session
      session.adminId = admin.id;

      this.logger.log(`API Login successful: ${admin.email} (ID: ${admin.id})`);

      return {
        success: true,
        message: 'Login successful',
        data: admin,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.warn(`API Login failed for email: ${loginDto.email}`);
      throw error;
    }
  }

  /**
   * POST /api/auth/logout
   * Logout and destroy session (JSON API)
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutAdmin(@Session() session: Record<string, any>) {
    const adminId = session?.adminId;

    if (!adminId) {
      throw new BadRequestException('No active session');
    }

    // Note: Session destruction in JSON API is tricky
    // For now, we'll just clear the adminId
    delete session.adminId;

    this.logger.log(`API Logout successful for admin: ${adminId}`);

    return {
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/auth/me
   * Get current authenticated admin (JSON API)
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentAdmin(@Session() session: Record<string, any>) {
    if (!session?.adminId) {
      throw new BadRequestException('Not authenticated');
    }

    const admin = await this.authService.findAdminById(session.adminId);

    if (!admin) {
      throw new BadRequestException('Admin account not found');
    }

    if (!admin.isActive) {
      throw new BadRequestException(
        'Your account is inactive. Please contact administrator.',
      );
    }

    this.logger.log(`API: Admin ${admin.id} fetched their profile`);

    return {
      success: true,
      message: 'Admin profile retrieved successfully',
      data: admin,
      timestamp: new Date().toISOString(),
    };
  }
}
