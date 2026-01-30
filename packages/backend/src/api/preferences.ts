/**
 * Preferences endpoints - GET /preferences, PATCH /preferences, GET /preferences/default-time-slot
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, sendError } from './routes.js';
import { getOrCreatePreferences, updatePreferences } from '../db/queries.js';
import { getDefaultTimeSlot } from '../services/time-slot.js';
import type { UserPreferencesResponse, DefaultTimeSlotResponse } from '@swim-check/shared';

export const preferencesRouter = Router();

// GET /preferences - Get user preferences
preferencesRouter.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const prefs = getOrCreatePreferences();

  const response: UserPreferencesResponse = {
    id: prefs.id,
    slotDurationMins: prefs.slotDurationMins,
    createdAt: prefs.createdAt.toISOString(),
    updatedAt: prefs.updatedAt.toISOString(),
  };

  res.json(response);
}));

// PATCH /preferences - Update user preferences
preferencesRouter.patch('/', asyncHandler(async (req: Request, res: Response) => {
  const { slotDurationMins } = req.body;

  // Validate slotDurationMins if provided
  if (slotDurationMins !== undefined) {
    if (typeof slotDurationMins !== 'number') {
      return sendError(res, 400, 'INVALID_DURATION', 'slotDurationMins must be a number');
    }
    if (slotDurationMins < 30 || slotDurationMins > 480) {
      return sendError(res, 400, 'INVALID_DURATION', 'slotDurationMins must be between 30 and 480');
    }
    if (slotDurationMins % 30 !== 0) {
      return sendError(res, 400, 'INVALID_DURATION', 'slotDurationMins must be a multiple of 30');
    }
  }

  const prefs = updatePreferences({ slotDurationMins });

  const response: UserPreferencesResponse = {
    id: prefs.id,
    slotDurationMins: prefs.slotDurationMins,
    createdAt: prefs.createdAt.toISOString(),
    updatedAt: prefs.updatedAt.toISOString(),
  };

  res.json(response);
}));

// GET /preferences/default-time-slot - Get smart default time slot
preferencesRouter.get('/default-time-slot', asyncHandler(async (_req: Request, res: Response) => {
  const defaultSlot = getDefaultTimeSlot();

  const response: DefaultTimeSlotResponse = {
    date: defaultSlot.date,
    startTime: defaultSlot.startTime,
    endTime: defaultSlot.endTime,
    durationMins: defaultSlot.durationMins,
  };

  res.json(response);
}));
