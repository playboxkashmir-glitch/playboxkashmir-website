import { query } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';

export default async function handler(req, res) {
  // Change this to your own secret before deploying
  const SETUP_KEY = 'PlayB0xKmR26#';

  if (req.query.key !== SETUP_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const username = 'ahmad'; // Change if you want
    const password = 'Khateeb76#$'; // Change to your own strong password

    const passwordHash = await hashPassword(password);

    await query(
      `INSERT INTO admin_users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username)
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         failed_attempts = 0,
         locked_until = NULL`,
      [username, passwordHash]
    );

    return res.status(200).json({
      success: true,
      username,
      message: 'Admin created successfully.'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
