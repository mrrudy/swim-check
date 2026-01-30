/**
 * Pool endpoints - GET /pools and GET /pools/:poolId
 */

import { Router, Request, Response } from 'express';
import { asyncHandler, sendError } from './routes.js';
import { getAllPools, getPoolById } from '../db/queries.js';
import type { ListPoolsResponse } from '@swim-check/shared';

export const poolsRouter = Router();

// GET /pools - List all pools
poolsRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

  const { pools, total } = getAllPools(search, limit, offset);

  const response: ListPoolsResponse = { pools, total };
  res.json(response);
}));

// GET /pools/:poolId - Get a specific pool
poolsRouter.get('/:poolId', asyncHandler(async (req: Request, res: Response) => {
  const { poolId } = req.params;

  const pool = getPoolById(poolId);

  if (!pool) {
    return sendError(res, 404, 'POOL_NOT_FOUND', `Pool with id '${poolId}' not found`);
  }

  res.json(pool);
}));
