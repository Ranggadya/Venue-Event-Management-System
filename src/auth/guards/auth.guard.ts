import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';

/**
 * AuthGuard
 * Protects routes that require authentication
 * Redirects unauthenticated users to login page
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const session = request.session;

    const { method, url, ip } = request;

    // Check if session exists and has adminId
    if (!session || !session.adminId) {
      this.logger.warn(
        `Unauthorized access attempt: ${method} ${url} from IP: ${ip}`,
      );

      response.redirect('/auth/login');
      return false;
    }

    this.logger.debug(
      `Authenticated request: ${method} ${url} by admin: ${session.adminId}`,
    );

    return true;
  }
}
