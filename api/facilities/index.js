// Vercel Serverless Function: Facilities collection (Football Turf, Cricket Nets, Pickleball Courts, etc.)
// GET  -> list all facilities with their base/peak pricing
// POST -> add a new facility/court

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

if (req.method === 'GET') {
const { rows } = await query(`SELECT * FROM facilities ORDER BY sport_key, option_name`);
return res.status(200).json({ facilities: rows });
}

if (req.method === 'POST') {
try {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const { sport_key, sport_name, option_id, option_name, base_price, peak_price } = body;
if (!sport_key || !sport_name || !option_id || !option_name || base_price === undefined) {
return res.status(400).json({ error: 'sport_key, sport_name, option_id, option_name and base_price are required.' });
}
const { rows } = await query(
`INSERT INTO facilities (sport_key, sport_name, option_id, option_name, base_price, peak_price)
VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
[sport_key, sport_name, option_id, option_name, base_price, peak_price ?? base_price]
);
return res.status(201).json({ facility: rows[0] });
} catch (err) {
if (err && err.code === '23505') {
return res.status(409).json({ error: 'A facility with that option_id already exists.' });
}
console.error('Create facility error:', err);
return res.status(500).json({ error: 'Server error while creating facility.' });
}
}

res.setHeader('Allow', 'GET, POST');
return res.status(405).json({ error: 'Method not allowed' });
}
