// Vercel Serverless Function: Generic key/value site settings
// (e.g. business hours, peak hours, contact info) stored as JSONB.
// GET  -> return all settings as a { key: value } object
// PUT  -> upsert one setting: { key, value }

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

if (req.method === 'GET') {
const { rows } = await query('SELECT key, value FROM settings');
const settings = {};
for (const row of rows) settings[row.key] = row.value;
return res.status(200).json({ settings });
}

if (req.method === 'PUT') {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const { key, value } = body;
if (!key || value === undefined) {
return res.status(400).json({ error: 'key and value are required.' });
}
const { rows } = await query(
`INSERT INTO settings (key, value) VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
RETURNING *`,
[key, JSON.stringify(value)]
);
return res.status(200).json({ setting: rows[0] });
}

res.setHeader('Allow', 'GET, PUT');
return res.status(405).json({ error: 'Method not allowed' });
}
