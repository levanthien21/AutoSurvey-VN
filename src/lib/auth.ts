import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db, User } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'autosurvey-commercial-secret-salt-2026';
export const SESSION_COOKIE_NAME = 'autosurvey_session';

export interface SessionPayload {
  userId: string;
  username?: string;
  email?: string;
  role?: 'user' | 'admin';
  credits?: number;
  avatar?: string;
  createdAt?: string;
  expiresAt: number;
}

/**
 * Generates a self-contained, cryptographically signed token valid for 30 days.
 * Ensures sessions persist reliably across serverless container restarts and page reloads.
 */
export function generateSessionToken(userOrId: string | Partial<User>): string {
  let userObj: Partial<User>;
  if (typeof userOrId === 'string') {
    const found = db.findUserById(userOrId);
    userObj = found || { id: userOrId };
  } else {
    userObj = userOrId;
  }

  const userId = userObj.id || 'usr_unknown';
  // 30 days expiration
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  const payload: SessionPayload = {
    userId,
    username: userObj.username || '',
    email: userObj.email || '',
    role: userObj.role || 'user',
    credits: userObj.credits ?? 5000,
    avatar: userObj.avatar || '',
    createdAt: userObj.createdAt || new Date().toISOString(),
    expiresAt,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('hex');
  return `${payloadStr}.${signature}`;
}

/**
 * Cryptographically verifies session token.
 * Supports both new self-contained JSON format and backward-compatible legacy format.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;

    // Format 1: New JSON token (payloadStr.signature)
    if (token.includes('.')) {
      const [payloadStr, signature] = token.split('.');
      if (!payloadStr || !signature) return null;

      const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const decoded = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8')) as SessionPayload;
      if (!decoded.userId || !decoded.expiresAt || Date.now() > decoded.expiresAt) {
        return null;
      }
      return decoded;
    }

    // Format 2: Legacy format (base64url encoded userId:expiresAt:signature)
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [userId, expiresAtStr, signature] = decoded.split(':');
    if (!userId || !expiresAtStr || !signature) return null;

    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

    const payload = `${userId}:${expiresAtStr}`;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { userId, expiresAt };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to get current logged in user from cookies
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session || !session.userId) return null;

    let user = db.findUserById(session.userId);
    if (!user && session.email) {
      user = db.findUserByEmail(session.email);
    }

    // Auto-restore user in container if fresh cold start
    if (!user) {
      user = db.upsertUser({
        id: session.userId,
        username: session.username || (session.email ? session.email.split('@')[0] : 'user'),
        email: session.email || '',
        role: session.role || 'user',
        credits: session.credits ?? (session.role === 'admin' ? 999999999 : 5000),
        avatar: session.avatar || '',
        passwordHash: '',
        salt: '',
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Helper to get current user from a NextRequest directly (for API route handlers)
 * Inspects both Authorization Bearer header and session cookie
 */
export function getUserFromRequest(req: Request): User | null {
  try {
    // 1. Check Authorization Bearer header first (works even if cookies are blocked by browser)
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    // 2. Fallback to session cookie
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
      token = match ? match[1].trim() : null;
    }

    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session || !session.userId) return null;

    // 3. Find user in database
    let user = db.findUserById(session.userId);
    if (!user && session.email) {
      user = db.findUserByEmail(session.email);
    }

    // 4. Auto-restore user in current serverless container if cold start
    if (!user) {
      user = db.upsertUser({
        id: session.userId,
        username: session.username || (session.email ? session.email.split('@')[0] : 'user'),
        email: session.email || '',
        role: session.role || 'user',
        credits: session.credits ?? (session.role === 'admin' ? 999999999 : 5000),
        avatar: session.avatar || '',
        passwordHash: '',
        salt: '',
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return user;
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('getUserFromRequest error:', err);
    return null;
  }
}
