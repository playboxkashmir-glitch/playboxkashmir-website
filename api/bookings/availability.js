// Vercel Serverless Function: Returns which time slots are already booked/blocked
// for a given date (and optionally a specific facility). The Admin 'Add Booking'
// modal calls this to disable slots that are already taken before submitting.

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

if (req.method !== 'GET') {
res.setHeader('Allow', 'GET');
return res.status(405).json({ error: 'Method not allowed' });
}

const { date, facility_id } = req.query || {};
if (!date) return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD).' });

try {
const params = [date];
let facilityClause = '';
if (facility_id) {
params.push(facility_id);
facilityClause = `AND facility_id = $${params.length}`;
}
const { rows } = await query(
`SELECT facility_id, start_time, end_time, status, booking_ref
FROM bookings
WHERE booking_date = $1 AND status IN ('reserved','confirmed') ${facilityClause}`,
params
);
return res.status(200).json({ date, blocked: rows });
} catch (err) {
console.error('Availability error:', err);
return res.status(500).json({ error: 'Server error while checking availability.' });
}
}
