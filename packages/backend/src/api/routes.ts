/**
 * Express router setup and middleware
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { ApiError } from '@swim-check/shared';

export function createRouter(): Router {
  const router = Router();

  // API version prefix will be applied at the app level
  return router;
}

// Error response helper
export function sendError(res: Response, status: number, code: string, message: string, details?: Record<string, unknown>): void {
  const error: ApiError = { code, message, details };
  res.status(status).json(error);
}

// Async handler wrapper to catch errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Error handler middleware
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('API Error:', err);

  // Check for specific error types
  if (err.message.includes('not found')) {
    return sendError(res, 404, 'NOT_FOUND', err.message);
  }

  if (err.message.includes('invalid') || err.message.includes('Invalid')) {
    return sendError(res, 400, 'VALIDATION_ERROR', err.message);
  }

  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

// Input validation helpers

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Date validation regex (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Time validation regex (HH:MM)
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isValidTime(value: string): boolean {
  return TIME_REGEX.test(value);
}

// Validation middleware factory
export function validateParams(
  validators: Record<string, (value: string) => boolean>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    for (const [param, validator] of Object.entries(validators)) {
      const value = req.params[param] || req.query[param];
      if (value && typeof value === 'string' && !validator(value)) {
        return sendError(res, 400, 'INVALID_PARAMETER', `Invalid ${param} format`);
      }
    }
    next();
  };
}

// Common validation middleware
export const validatePoolId = validateParams({
  poolId: isValidUUID,
});

export const validateDateTimeParams = validateParams({
  date: isValidDate,
  startTime: isValidTime,
  endTime: isValidTime,
});
