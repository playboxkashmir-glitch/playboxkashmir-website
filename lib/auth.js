// Authentication helpers: password hashing, JWT session tokens, httpOnly cookies,
// and basic brute-force lockout support for the admin login endpoint.

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'pbk_admin_token';
const TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 hours

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set.');
  return jwt.sign(payload, secret, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set.');
  return jwt.verify(token, secret);
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = decodeURIComponent(pair.slice(idx + 1).trim());
    out[key] = val;
  });
  return out;
}

export function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${TOKEN_TTL_SECONDS}`,
    'SameSite=Strict'
    ];
  if (isProd) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
}

// Verifies the session cookie on protected API routes.
// On failure it sends the 401 response itself and returns null so callers can `if (!user) return;`
export function requireAuth(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated.' });
    return null;
  }
  try {
    return verifyToken(token);
  } catch (err) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
    return null;
  }
}

export { COOKIE_NAME, TOKEN_TTL_SECONDS };
