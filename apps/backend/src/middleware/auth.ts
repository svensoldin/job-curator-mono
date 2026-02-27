import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';

declare global {
  namespace Express {
    interface Request {
      user: { id: string };
    }
  }
}

/**
 * Validates the Supabase JWT from the `Authorization: Bearer <token>` header.
 * On success, attaches `req.user.id` and calls next().
 * Returns 401 if the token is missing or invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = { id: user.id };
  next();
}
