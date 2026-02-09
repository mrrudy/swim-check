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
    compactViewEnabled: prefs.compactViewEnabled,
    forwardSlotCount: prefs.forwardSlotCount,
    showNavEnabled: prefs.showNavEnabled,
    createdAt: prefs.createdAt.toISOString(),
    updatedAt: prefs.updatedAt.toISOString(),
  };

  res.json(response);
}));

// PATCH /preferences - Update user preferences
preferencesRouter.patch('/', asyncHandler(async (req: Request, res: Response) => {
  const { slotDurationMins, compactViewEnabled, forwardSlotCount, showNavEnabled } = req.body;

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

  // Validate compactViewEnabled if provided (005-pool-view-options)
  if (compactViewEnabled !== undefined) {
    if (typeof compactViewEnabled !== 'boolean') {
      return sendError(res, 400, 'INVALID_COMPACT_VIEW', 'compactViewEnabled must be a boolean');
    }
  }

  // Validate forwardSlotCount if provided (005-pool-view-options)
  if (forwardSlotCount !== undefined) {
    if (typeof forwardSlotCount !== 'number') {
      return sendError(res, 400, 'INVALID_FORWARD_SLOT_COUNT', 'forwardSlotCount must be a number');
    }
    if (!Number.isInteger(forwardSlotCount)) {
      return sendError(res, 400, 'INVALID_FORWARD_SLOT_COUNT', 'forwardSlotCount must be an integer');
    }
    if (forwardSlotCount < 1 || forwardSlotCount > 10) {
      return sendError(res, 400, 'INVALID_FORWARD_SLOT_COUNT', 'forwardSlotCount must be between 1 and 10');
    }
  }

  // Validate showNavEnabled if provided (009-mobile-ui-refinements)
  if (showNavEnabled !== undefined) {
    if (typeof showNavEnabled !== 'boolean') {
      return sendError(res, 400, 'INVALID_SHOW_NAV', 'showNavEnabled must be a boolean');
    }
  }

  const prefs = updatePreferences({ slotDurationMins, compactViewEnabled, forwardSlotCount, showNavEnabled });

  const response: UserPreferencesResponse = {
    id: prefs.id,
    slotDurationMins: prefs.slotDurationMins,
    compactViewEnabled: prefs.compactViewEnabled,
    forwardSlotCount: prefs.forwardSlotCount,
    showNavEnabled: prefs.showNavEnabled,
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
