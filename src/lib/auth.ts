import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db, User } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'autosurvey-commercial-secret-salt-2026';
export const SESSION_COOKIE_NAME = 'autosurvey_session';

export function generateSessionToken(userId: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${userId}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [userId, expiresAtStr, signature] = decoded.split(':');
    if (!userId || !expiresAtStr || !signature) return null;

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

    const payload = `${userId}:${expiresAtStr}`;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { userId };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to get current logged in user from cookies or Authorization header
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const verified = verifySessionToken(token);
    if (!verified) return null;

    const user = db.findUserById(verified.userId);
    return user || null;
  } catch {
    return null;
  }
}

/**
 * Helper to get current user from a NextRequest directly (for API route handlers)
 */
export function getUserFromRequest(req: Request): User | null {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    let token = match ? match[1] : null;

    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) return null;

    const verified = verifySessionToken(token);
    if (!verified) return null;

    return db.findUserById(verified.userId) || null;
  } catch {
    return null;
  }
}
