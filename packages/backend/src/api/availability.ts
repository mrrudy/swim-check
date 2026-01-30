/**
 * Availability endpoint - GET /pools/:poolId/availability
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, sendError } from './routes.js';
import { availabilityService } from '../services/availability.js';
import { getPoolById } from '../db/queries.js';
import type { PoolAvailabilityResponse, TimeSlot } from '@swim-check/shared';

export const availabilityRouter = Router();

// Time format validation regex: HH:MM
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Date format validation regex: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// GET /pools/:poolId/availability
availabilityRouter.get('/:poolId/availability', asyncHandler(async (req: Request, res: Response) => {
  const { poolId } = req.params;
  const { date, startTime, endTime, refresh } = req.query;

  // Validate required parameters
  if (!date) {
    return sendError(res, 400, 'MISSING_DATE', 'date parameter is required');
  }
  if (!startTime) {
    return sendError(res, 400, 'MISSING_START_TIME', 'startTime parameter is required');
  }
  if (!endTime) {
    return sendError(res, 400, 'MISSING_END_TIME', 'endTime parameter is required');
  }

  // Validate date format
  const dateStr = date as string;
  if (!DATE_REGEX.test(dateStr)) {
    return sendError(res, 400, 'INVALID_DATE_FORMAT', 'date must be in YYYY-MM-DD format');
  }

  // Validate time formats
  const startTimeStr = startTime as string;
  const endTimeStr = endTime as string;

  if (!TIME_REGEX.test(startTimeStr)) {
    return sendError(res, 400, 'INVALID_TIME_FORMAT', 'startTime must be in HH:MM format');
  }
  if (!TIME_REGEX.test(endTimeStr)) {
    return sendError(res, 400, 'INVALID_TIME_FORMAT', 'endTime must be in HH:MM format');
  }

  // Validate startTime < endTime
  if (startTimeStr >= endTimeStr) {
    return sendError(res, 400, 'INVALID_TIME_RANGE', 'startTime must be before endTime');
  }

  // Check pool exists
  const pool = getPoolById(poolId);
  if (!pool) {
    return sendError(res, 404, 'POOL_NOT_FOUND', `Pool with id '${poolId}' not found`);
  }

  const timeSlot: TimeSlot = {
    startTime: startTimeStr,
    endTime: endTimeStr,
  };

  const forceRefresh = refresh === 'true';
  const parsedDate = new Date(dateStr);

  try {
    const availability = await availabilityService.getAvailability(
      poolId,
      parsedDate,
      timeSlot,
      forceRefresh
    );

    const response: PoolAvailabilityResponse = {
      pool: availability.pool,
      date: availability.date,
      timeSlot: availability.timeSlot,
      lanes: availability.lanes,
      dataFreshness: availability.dataFreshness,
      scrapedAt: availability.scrapedAt?.toISOString(),
      availableLaneCount: availability.availableLaneCount,
      totalLaneCount: availability.totalLaneCount,
    };

    // Set appropriate status code based on freshness
    const statusCode = availability.dataFreshness === 'unavailable' ? 503 : 200;
    res.status(statusCode).json(response);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return sendError(res, 500, 'AVAILABILITY_ERROR', 'Failed to fetch availability');
  }
}));
