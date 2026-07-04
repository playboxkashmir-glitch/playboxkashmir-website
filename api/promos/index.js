// Vercel Serverless Function: Promo codes collection
// GET  -> list all promo codes
// POST -> create a new promo code (percent or flat discount)

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

if (req.method === 'GET') {
const { rows } = await query(`SELECT * FROM promo_codes ORDER BY created_at DESC`);
return res.status(200).json({ promos: rows });
}

if (req.method === 'POST') {
try {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const { code, type, value, min_amount } = body;
if (!code || !type || value === undefined) {
return res.status(400).json({ error: 'code, type and value are required.' });
}
if (!['percent', 'flat'].includes(type)) {
return res.status(400).json({ error: "type must be 'percent' or 'flat'." });
}
const { rows } = await query(
`INSERT INTO promo_codes (code, type, value, min_amount) VALUES ($1,$2,$3,$4) RETURNING *`,
[code.toUpperCase(), type, value, min_amount || 0]
);
return res.status(201).json({ promo: rows[0] });
} catch (err) {
if (err && err.code === '23505') {
return res.status(409).json({ error: 'A promo code with that name already exists.' });
}
console.error('Create promo error:', err);
return res.status(500).json({ error: 'Server error while creating promo code.' });
}
}

res.setHeader('Allow', 'GET, POST');
return res.status(405).json({ error: 'Method not allowed' });
}
