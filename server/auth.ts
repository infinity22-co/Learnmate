import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import { User, UserRole } from '../src/types/index.js';

export interface AuthRequest extends Request {
  user?: User;
}

// Secure password hashing with salt using standard Node.js crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Session tokens store
const sessionTokens = new Map<string, { userId: string; expiresAt: number }>();

export function createSessionToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  // Token expires in 7 days
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  sessionTokens.set(token, { userId, expiresAt });
  return token;
}

export function invalidateToken(token: string): void {
  sessionTokens.delete(token);
}

export function getUserIdFromToken(token: string): string | null {
  const session = sessionTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessionTokens.delete(token);
    return null;
  }
  return session.userId;
}

// Authentication middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.substring(7);
  const userId = getUserIdFromToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  const user = db.getUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User not found' });
    return;
  }

  req.user = user;
  next();
}

// Role-based authorization middleware
export function requireRole(allowedRole: UserRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (req.user.role !== allowedRole) {
      res.status(403).json({ error: `Forbidden: Requires ${allowedRole} privileges` });
      return;
    }
    next();
  };
}
