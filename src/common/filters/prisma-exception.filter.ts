import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Prisma Exception Filter
 * Handles database-related errors from Prisma
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle specific Prisma error codes
    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists';
        break;

      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record does not exist';
        break;

      case 'P2014':
        // Invalid ID
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID provided';
        break;

      case 'P2011':
        // Null constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Required field cannot be null';
        break;

      case 'P2023':
        // Inconsistent column data
        status = HttpStatus.BAD_REQUEST;
        message = 'Inconsistent column data';
        break;

      default:
        this.logger.error(
          `Unhandled Prisma Error: ${exception.code}`,
          exception.message,
        );
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Prisma Error ${exception.code}: ${message}`,
    );

    response.status(status).json({
      statusCode: status,
      message: [message],
      error: 'Database Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
