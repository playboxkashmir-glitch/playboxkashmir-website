// Vercel Serverless Function: Admin login
// Includes a temporary one-time admin setup endpoint.
// REMOVE the setup block after your admin account is created.

import { query } from '../../lib/db.js';
import {
  verifyPassword,
  hashPassword,
  signToken,
  setAuthCookie
} from '../../lib/auth.js';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// CHANGE THESE
const SETUP_KEY = 'PlayBoxSetup2026!X9kLm';
const SETUP_USERNAME = 'admin';
const SETUP_PASSWORD = 'Khateeb76#$';

export default async function handler(req, res) {

  // ==========================
  // TEMPORARY ADMIN SETUP
  // ==========================
  if (req.method === 'GET') {

    if (req.query.setup !== SETUP_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {

      const passwordHash = await hashPassword(SETUP_PASSWORD);

      await query(
        `INSERT INTO admin_users (username, password_hash)
         VALUES ($1,$2)
         ON CONFLICT (username)
         DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           failed_attempts = 0,
           locked_until = NULL`,
        [SETUP_USERNAME, passwordHash]
      );

      return res.status(200).json({
        success: true,
        username: SETUP_USERNAME,
        message: 'Admin created successfully.'
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: err.message
      });
    }

  }

  // ==========================
  // NORMAL LOGIN
  // ==========================

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required.'
      });
    }

    const { rows } = await query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );

    const user = rows[0];

    const genericError = 'Invalid username or password.';

    if (!user) {
      return res.status(401).json({
        error: genericError
      });
    }

    if (
      user.locked_until &&
      new Date(user.locked_until) > new Date()
    ) {
      return res.status(423).json({
        error:
          'Account temporarily locked due to repeated failed attempts. Try again later.'
      });
    }

    const valid = await verifyPassword(
      password,
      user.password_hash
    );

    if (!valid) {

      const attempts =
        (user.failed_attempts || 0) + 1;

      const lockedUntil =
        attempts >= MAX_ATTEMPTS
          ? new Date(
              Date.now() +
                LOCK_MINUTES * 60 * 1000
            )
          : null;

      await query(
        'UPDATE admin_users SET failed_attempts=$1, locked_until=$2 WHERE id=$3',
        [attempts, lockedUntil, user.id]
      );

      return res.status(401).json({
        error: genericError
      });

    }

    await query(
      'UPDATE admin_users SET failed_attempts=0, locked_until=NULL, last_login=now() WHERE id=$1',
      [user.id]
    );

    const token = signToken({
      sub: user.id,
      username: user.username
    });

    setAuthCookie(res, token);

    return res.status(200).json({
      ok: true,
      username: user.username
    });

  } catch (err) {

    console.error('Login error:', err);

    return res.status(500).json({
      error: 'Server error during login.'
    });

  }

}
