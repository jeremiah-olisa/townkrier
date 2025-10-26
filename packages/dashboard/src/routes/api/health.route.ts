import type { Request, Response } from 'express';

/**
 * GET /api/health - Health check
 */
export function healthRoute(req: Request, res: Response): void {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    version: '1.0.0-alpha.1',
  });
}
