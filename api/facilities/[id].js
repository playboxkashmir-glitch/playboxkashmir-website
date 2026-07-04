// Vercel Serverless Function: Update a single facility's name, pricing, or active status.

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

const { id } = req.query;
if (!id) return res.status(400).json({ error: 'Facility id is required.' });

if (req.method === 'PATCH') {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const allowed = ['option_name', 'base_price', 'peak_price', 'is_active'];
const sets = [];
const params = [];
for (const key of allowed) {
if (body[key] !== undefined) {
params.push(body[key]);
sets.push(`${key} = $${params.length}`);
}
}
if (!sets.length) return res.status(400).json({ error: 'No valid fields to update.' });
params.push(id);
const { rows } = await query(
`UPDATE facilities SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
params
);
if (!rows[0]) return res.status(404).json({ error: 'Facility not found.' });
return res.status(200).json({ facility: rows[0] });
}

res.setHeader('Allow', 'PATCH');
return res.status(405).json({ error: 'Method not allowed' });
}
