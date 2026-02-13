/* eslint-disable @typescript-eslint/require-await */
import {
  Controller,
  Post,
  Body,
  Session,
  Get,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  // GET /auth/login
  @Get('login')
  async getLoginPage(
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    if (session?.adminId) {
      this.logger.log(
        `Admin ${session.adminId} already authenticated, redirecting to dashboard`,
      );
      return res.redirect('/dashboard');
    }

    // Render login page
    return res.render('auth/login', {
      title: 'Admin Login',
      error: null,
      email: '',
      layout: false,
    });
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async loginAdmin(
    @Body() loginDto: LoginDto,
    @Session() session: Record<string, any>,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      // Validate credentials
      const admin = await this.authService.validateAdminCredentials(loginDto);

      // Store admin ID in session
      session.adminId = admin.id;

      // Handle "Remember Me"
      if (loginDto.remember) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }

      this.logger.log(
        `Admin login successful: ${admin.email} (ID: ${admin.id}) from IP: ${req.ip}`,
      );

      // Redirect to dashboard
      return res.redirect('/dashboard');
    } catch (error) {
      this.logger.warn(
        `Failed login attempt for email: ${loginDto.email} from IP: ${req.ip}`,
      );
      return res.status(HttpStatus.UNAUTHORIZED).render('auth/login', {
        title: 'Admin Login',
        error:
          error instanceof Error
            ? error.message
            : 'Login failed. Please try again.',
        email: loginDto.email,
        layout: false,
      });
    }
  }

  // GET /auth/logout
  @Get('logout')
  async logoutAdmin(@Req() req: Request, @Res() res: Response) {
    const adminId = req.session?.adminId;

    // If no active session, just redirect to login
    if (!adminId) {
      this.logger.warn(
        `Logout attempted without active session from IP: ${req.ip}`,
      );
      return res.redirect('/auth/login');
    }

    // Destroy session
    return new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => {
        if (error) {
          this.logger.error(
            `Failed to destroy session for admin ${adminId}:`,
            error,
          );
          return reject(
            new BadRequestException('Failed to logout. Please try again.'),
          );
        }

        this.logger.log(`Admin ${adminId} logged out successfully`);

        // Clear session cookie
        res.clearCookie('sessionId');

        // Redirect to login page
        res.redirect('/auth/login');
        resolve();
      });
    });
  }

  // GET /auth/me
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentAdmin(@Session() session: Record<string, any>) {
    // Check if authenticated
    if (!session?.adminId) {
      throw new BadRequestException('Not authenticated');
    }

    // Get admin data
    const admin = await this.authService.findAdminById(session.adminId);

    if (!admin) {
      throw new BadRequestException('Admin account not found');
    }

    if (!admin.isActive) {
      throw new BadRequestException(
        'Your account is inactive. Please contact administrator.',
      );
    }

    this.logger.log(`Admin ${admin.id} fetched their profile`);

    return {
      success: true,
      message: 'Admin profile retrieved successfully',
      data: admin,
    };
  }
}
