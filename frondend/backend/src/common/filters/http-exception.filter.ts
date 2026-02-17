import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    // Handle validation errors properly
    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // If it's a validation error (BadRequestException with validation messages)
    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      const exceptionMessage = (exceptionResponse as any).message;

      // Check if it's an array of validation errors
      if (Array.isArray(exceptionMessage)) {
        errorResponse.message = 'Validation failed';
        errorResponse.errors = exceptionMessage;
      } else {
        errorResponse.message = exceptionMessage;
      }

      // Include error type if available
      if ('error' in exceptionResponse) {
        errorResponse.error = (exceptionResponse as any).error;
      }
    } else {
      errorResponse.message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : 'An error occurred';
    }

    // Log error details (only log actual errors, not validation errors)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : 'Unknown error',
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
