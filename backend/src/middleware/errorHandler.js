import { config } from '../config/env.js';

/**
 * Custom application error class.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error-handling middleware.
 */
export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  console.error('[ERROR]', {
    message: err.message,
    statusCode,
    isOperational,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  const response = {
    success: false,
    error: {
      message: config.nodeEnv === 'development' ? err.message : (isOperational ? err.message : 'Internal server error'),
      ...(config.nodeEnv === 'development' && {
        stack: err.stack,
        details: err.message,
      }),
    },
  };

  res.status(statusCode).json(response);
}

export function notFoundHandler(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
