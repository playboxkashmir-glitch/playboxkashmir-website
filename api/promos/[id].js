// Vercel Serverless Function: Update or remove a single promo code.

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

const { id } = req.query;
if (!id) return res.status(400).json({ error: 'Promo id is required.' });

if (req.method === 'PATCH') {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const allowed = ['type', 'value', 'min_amount', 'is_active'];
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
`UPDATE promo_codes SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
params
);
if (!rows[0]) return res.status(404).json({ error: 'Promo code not found.' });
return res.status(200).json({ promo: rows[0] });
}

if (req.method === 'DELETE') {
const { rows } = await query(`DELETE FROM promo_codes WHERE id=$1 RETURNING *`, [id]);
if (!rows[0]) return res.status(404).json({ error: 'Promo code not found.' });
return res.status(200).json({ ok: true });
}

res.setHeader('Allow', 'PATCH, DELETE');
return res.status(405).json({ error: 'Method not allowed' });
}
