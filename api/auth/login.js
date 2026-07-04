// Vercel Serverless Function: Admin login
// Verifies username/password against the admin_users table, applies a basic
// lockout after repeated failed attempts, and sets an httpOnly JWT session cookie.

import { query } from '../../lib/db.js';
import { verifyPassword, signToken, setAuthCookie } from '../../lib/auth.js';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

try {
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const username = (body.username || '').trim();
  const password = body.password || '';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const { rows } = await query('SELECT * FROM admin_users WHERE username = $1', [username]);
  const user = rows[0];
  const genericError = 'Invalid username or password.';

  if (!user) {
    return res.status(401).json({ error: genericError });
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return res.status(423).json({ error: 'Account temporarily locked due to repeated failed attempts. Try again later.' });
  }

  const valid = await verifyPassword(password, user.password_hash);

  if (!valid) {
    const attempts = (user.failed_attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null;
    await query('UPDATE admin_users SET failed_attempts = $1, locked_until = $2 WHERE id = $3', [attempts, lockedUntil, user.id]);
    return res.status(401).json({ error: genericError });
  }

  await query('UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login = now() WHERE id = $1', [user.id]);

  const token = signToken({ sub: user.id, username: user.username });
  setAuthCookie(res, token);

  return res.status(200).json({ ok: true, username: user.username });
} catch (err) {
  console.error('Login error:', err);
  return res.status(500).json({ error: 'Server error during login.' });
}
}
