import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';

/**
 * ApiAuthGuard
 * Protects API routes that require authentication
 * Throws UnauthorizedException (401) for unauthenticated requests
 * Use this guard for /api/* routes
 */
@Injectable()
export class ApiAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session;

    const { method, url, ip } = request;

    // Check if session exists and has adminId
    if (!session || !session.adminId) {
      this.logger.warn(
        `Unauthorized API access attempt: ${method} ${url} from IP: ${ip}`,
      );

      throw new UnauthorizedException({
        success: false,
        message: 'Authentication required. Please login first.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    }

    this.logger.debug(
      `Authenticated API request: ${method} ${url} by admin: ${session.adminId}`,
    );

    return true;
  }
}
