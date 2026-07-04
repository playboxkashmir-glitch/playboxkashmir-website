// Vercel Serverless Function: Single booking resource
// GET    -> fetch one booking
// PATCH  -> update fields (e.g. status, contact details, rate)
// DELETE -> soft-cancel (sets status='cancelled', keeps the record & history)

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

const { id } = req.query;
if (!id) return res.status(400).json({ error: 'Booking id is required.' });

if (req.method === 'GET') {
const { rows } = await query(
`SELECT b.*, f.option_name, f.sport_name FROM bookings b JOIN facilities f ON f.id=b.facility_id WHERE b.id=$1`,
[id]
);
if (!rows[0]) return res.status(404).json({ error: 'Booking not found.' });
return res.status(200).json({ booking: rows[0] });
}

if (req.method === 'PATCH') {
try {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const allowed = ['status', 'customer_name', 'customer_email', 'customer_phone', 'rate', 'amount', 'notes'];
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
`UPDATE bookings SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
params
);
if (!rows[0]) return res.status(404).json({ error: 'Booking not found.' });
return res.status(200).json({ booking: rows[0] });
} catch (err) {
if (err && err.code === '23505') {
return res.status(409).json({ error: 'That date and time slot is already booked for this facility.' });
}
console.error('Update booking error:', err);
return res.status(500).json({ error: 'Server error while updating booking.' });
}
}

if (req.method === 'DELETE') {
const { rows } = await query(
`UPDATE bookings SET status='cancelled', updated_at=now() WHERE id=$1 RETURNING *`,
[id]
);
if (!rows[0]) return res.status(404).json({ error: 'Booking not found.' });
return res.status(200).json({ booking: rows[0] });
}

res.setHeader('Allow', 'GET, PATCH, DELETE');
return res.status(405).json({ error: 'Method not allowed' });
}
