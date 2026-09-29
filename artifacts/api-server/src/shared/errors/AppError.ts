/**
 * AppError — domain error class for the OneTap API.
 *
 * Throw an AppError from any service or repository layer.
 * The Fastify global error handler converts it into the correct HTTP response.
 *
 * @example
 * throw AppError.notFound('Room not found');
 * throw AppError.conflict('Username already taken');
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Fastify's setErrorHandler reads error.statusCode to choose the HTTP status.
    Object.defineProperty(this, 'statusCode', { value: statusCode });
  }

  static badRequest(message: string, code?: string): AppError {
    return new AppError(400, message, code ?? 'BAD_REQUEST');
  }
  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Not found'): AppError {
    return new AppError(404, message, 'NOT_FOUND');
  }
  static conflict(message: string): AppError {
    return new AppError(409, message, 'CONFLICT');
  }
  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, message, 'INTERNAL');
  }
}
