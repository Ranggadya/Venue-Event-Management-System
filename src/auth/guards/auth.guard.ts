/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = request.session;

    const { method, url, ip } = request;

    // Check if session exists and has adminId
    if (!session || !session.adminId) {
      this.logger.warn(
        `Unauthorized access attempt: ${method} ${url} from IP: ${ip}`,
      );
      throw new UnauthorizedException(
        'You must be logged in to access this resource',
      );
    }

    const sessionAge = Date.now() - (session.cookie.originalMaxAge || 0);
    if (sessionAge > 24 * 60 * 60 * 1000) {
      // 24 hours
      this.logger.warn(
        `Expired session detected for admin: ${session.adminId}`,
      );
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    this.logger.log(
      `Authenticated request: ${method} ${url} by admin: ${session.adminId}`,
    );
    return true;
  }
}
