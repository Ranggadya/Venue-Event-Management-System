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
  private readonly SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

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

    // Check session expiry
    const sessionCreatedAt = session.cookie?.expires
      ? new Date(session.cookie.expires).getTime() -
        (session.cookie.maxAge || this.SESSION_MAX_AGE)
      : Date.now();

    const sessionAge = Date.now() - sessionCreatedAt;

    if (sessionAge > this.SESSION_MAX_AGE) {
      this.logger.warn(
        `Expired session detected for admin: ${session.adminId} (age: ${Math.round(sessionAge / 1000 / 60)} minutes)`,
      );

      return new Promise<boolean>((resolve) => {
        request.session.destroy((err) => {
          if (err) {
            this.logger.error('Failed to destroy expired session:', err);
          }

          // Clear cookie
          response.clearCookie('sessionId');

          // Redirect to login
          response.redirect('/auth/login');
          resolve(false);
        });
      });
    }

    this.logger.debug(
      `Authenticated request: ${method} ${url} by admin: ${session.adminId}`,
    );

    return true;
  }
}
