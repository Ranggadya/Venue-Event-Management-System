/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate admin login credentials
   * @param loginDto - Email and password from login form
   * @returns Admin data without password hash
   * @throws UnauthorizedException if credentials are invalid or account is inactive
   */
  async validateAdminCredentials(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const admin = await this.prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!admin) {
      this.logger.warn(`Login attempt with non-existent email: ${email}`);
      throw new UnauthorizedException(
        'Invalid email or password. Please check your credentials.',
      );
    }

    if (!admin.isActive) {
      this.logger.warn(
        `Login attempt for inactive account: ${email} (ID: ${admin.id})`,
      );
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact the administrator.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for email: ${email}`);
      throw new UnauthorizedException(
        'Invalid email or password. Please check your credentials.',
      );
    }

    const { passwordHash, ...adminWithoutPassword } = admin;

    this.logger.log(
      `Admin authenticated successfully: ${admin.email} (ID: ${admin.id})`,
    );

    return adminWithoutPassword;
  }

  /**
   * Find admin by ID
   * @param id - Admin UUID
   * @returns Admin data without password hash
   * @throws NotFoundException if admin does not exist
   */
  async findAdminById(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      this.logger.error(`Admin not found with ID: ${id}`);
      throw new NotFoundException('Admin account not found');
    }

    return admin;
  }

  /**
   * Create a new admin account (for seeding/testing)
   * @param email - Admin email
   * @param password - Plain text password (will be hashed)
   * @param name - Admin name (optional)
   * @returns Created admin data without password hash
   */
  async createAdmin(email: string, password: string, name?: string) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const admin = await this.prisma.admin.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name || null,
        isActive: true,
      },
    });

    const { passwordHash: _, ...adminWithoutPassword } = admin;

    this.logger.log(`New admin created: ${admin.email} (ID: ${admin.id})`);

    return adminWithoutPassword;
  }

  /**
   * Update admin active status
   * @param id - Admin UUID
   * @param isActive - New active status
   */
  async updateAdminStatus(id: string, isActive: boolean) {
    const admin = await this.prisma.admin.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    this.logger.log(
      `Admin ${admin.email} status updated: isActive = ${isActive}`,
    );

    return admin;
  }
}
