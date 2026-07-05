import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from './api-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Error interno del servidor';
    let details = '';

    if (exception instanceof HttpException) {
      message = exception.message;
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        details = (exceptionResponse as any).message || JSON.stringify(exceptionResponse);
      } else {
        details = String(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      details = exception.stack || '';
    } else {
      details = String(exception);
    }

    response
      .status(status)
      .json(ApiResponse.error(message, details));
  }
}
