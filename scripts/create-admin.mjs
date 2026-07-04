// One-time setup script: creates or updates the initial admin user.
// Run this locally (NOT on Vercel) after setting DATABASE_URL in your shell:
//
//   DATABASE_URL="postgres://..." ADMIN_USERNAME="admin" ADMIN_PASSWORD="choose-a-strong-password" node scripts/create-admin.mjs
//
// The password is hashed with bcrypt before being stored - the plaintext
// password itself is never saved anywhere.

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const { DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable.');
    process.exit(1);
  }
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('Usage: ADMIN_USERNAME=... ADMIN_PASSWORD=... DATABASE_URL=... node scripts/create-admin.mjs');
        process.exit(1);
      }
        if (ADMIN_PASSWORD.length < 10) {
          console.error('Please choose a password with at least 10 characters.');
            process.exit(1);
          }

            const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

            async function main() {
              const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
              await pool.query(
                `INSERT INTO admin_users (username, password_hash)
                VALUES ($1, $2)
                ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, failed_attempts = 0, locked_until = NULL`,
                [ADMIN_USERNAME, passwordHash]
              );
              console.log(`Admin user "${ADMIN_USERNAME}" created/updated successfully.`);
              await pool.end();
            }

            main().catch((err) => {
                console.error('Failed to create admin user:', err);
                process.exit(1);
                });
            
