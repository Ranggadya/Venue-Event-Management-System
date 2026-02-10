import {
  Controller,
  Post,
  Body,
  Session,
  HttpCode,
  HttpStatus,
  Get,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login - Admin login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 6000 } })
  async loginAdmin(
    @Body() loginDto: LoginDto,
    @Session() session: Record<string, any>,
  ) {
    const admin = await this.authService.validateAdminCredentials(loginDto);
    session.adminId = admin.id;

    return {
      message: 'Login successful',
      data: admin,
    };
  }

  /**
   * POST /auth/logout - Admin logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logoutAdmin(@Req() req: Request) {
    return new Promise<{ message: string }>((resolve, reject) => {
      req.session.destroy((error) => {
        if (error) {
          return reject(
            new UnauthorizedException('Failed to logout. Please try again.'),
          );
        }
        resolve({ message: 'Logout successful' });
      });
    });
  }

  /**
   * GET /auth/me - Get current admin
   */
  @Get('me')
  async getCurrentAdmin(@Session() session: Record<string, any>) {
    if (!session.adminId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const admin = await this.authService.findAdminById(session.adminId);

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException(
        'Your account is inactive. Please contact administrator.',
      );
    }

    return {
      message: 'Success',
      data: admin,
    };
  }
}
