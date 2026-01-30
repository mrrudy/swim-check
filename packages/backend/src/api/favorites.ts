/**
 * Favorites endpoints - GET /favorites, POST /favorites, DELETE /favorites/:poolId, PUT /favorites/reorder
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, sendError } from './routes.js';
import { getFavorites, addFavorite, removeFavorite, reorderFavorites, getPoolById } from '../db/queries.js';
import type { ListFavoritesResponse, FavoritePoolResponse } from '@swim-check/shared';

export const favoritesRouter = Router();

// GET /favorites - List favorite pools
favoritesRouter.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const favorites = getFavorites();

  const response: ListFavoritesResponse = {
    favorites: favorites
      .map((fav) => {
        const pool = getPoolById(fav.poolId);
        if (!pool) return null;
        return {
          pool,
          addedAt: fav.addedAt.toISOString(),
          displayOrder: fav.displayOrder,
        };
      })
      .filter((f): f is FavoritePoolResponse => f !== null),
  };

  res.json(response);
}));

// POST /favorites - Add pool to favorites
favoritesRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { poolId } = req.body;

  if (!poolId) {
    return sendError(res, 400, 'MISSING_POOL_ID', 'poolId is required');
  }

  // Check pool exists
  const pool = getPoolById(poolId);
  if (!pool) {
    return sendError(res, 404, 'POOL_NOT_FOUND', `Pool with id '${poolId}' not found`);
  }

  // Check if already a favorite
  const existingFavorites = getFavorites();
  const alreadyFavorite = existingFavorites.some((f) => f.poolId === poolId);
  if (alreadyFavorite) {
    return sendError(res, 409, 'ALREADY_FAVORITE', 'Pool is already in favorites');
  }

  // Add to favorites
  addFavorite(poolId);

  // Get the updated favorite
  const updatedFavorites = getFavorites();
  const newFavorite = updatedFavorites.find((f) => f.poolId === poolId);

  const response: FavoritePoolResponse = {
    pool,
    addedAt: newFavorite?.addedAt.toISOString() || new Date().toISOString(),
    displayOrder: newFavorite?.displayOrder || 0,
  };

  res.status(201).json(response);
}));

// DELETE /favorites/:poolId - Remove pool from favorites
favoritesRouter.delete('/:poolId', asyncHandler(async (req: Request, res: Response) => {
  const { poolId } = req.params;

  const removed = removeFavorite(poolId);
  if (!removed) {
    return sendError(res, 404, 'FAVORITE_NOT_FOUND', `Pool '${poolId}' is not in favorites`);
  }

  res.status(204).send();
}));

// PUT /favorites/reorder - Reorder favorite pools
favoritesRouter.put('/reorder', asyncHandler(async (req: Request, res: Response) => {
  const { order } = req.body;

  if (!order || !Array.isArray(order)) {
    return sendError(res, 400, 'INVALID_ORDER', 'order must be an array of pool IDs');
  }

  // Validate all pool IDs
  for (const poolId of order) {
    if (typeof poolId !== 'string') {
      return sendError(res, 400, 'INVALID_POOL_ID', 'All items in order must be strings');
    }
  }

  // Reorder
  reorderFavorites(order);

  // Return updated list
  const favorites = getFavorites();
  const response: ListFavoritesResponse = {
    favorites: favorites
      .map((fav) => {
        const pool = getPoolById(fav.poolId);
        if (!pool) return null;
        return {
          pool,
          addedAt: fav.addedAt.toISOString(),
          displayOrder: fav.displayOrder,
        };
      })
      .filter((f): f is FavoritePoolResponse => f !== null),
  };

  res.json(response);
}));
