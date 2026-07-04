// Vercel Serverless Function: Bookings collection
// GET  -> list bookings (optionally filtered by date/from/to/status/facility_id)
// POST -> create a booking (used by the Admin 'Add Booking' manual module).
// A unique DB index on (facility_id, booking_date, start_time) for active bookings
// guarantees the same slot can never be double-booked, even under concurrent requests.

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

function generateBookingRef() {
const ts = Date.now().toString(36).toUpperCase();
const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
return `PBK-${ts}-${rand}`;
}

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

if (req.method === 'GET') return handleList(req, res);
if (req.method === 'POST') return handleCreate(req, res);

res.setHeader('Allow', 'GET, POST');
return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req, res) {
try {
const { date, status, from, to, facility_id } = req.query || {};
const clauses = [];
const params = [];

if (date) { params.push(date); clauses.push(`b.booking_date = $${params.length}`); }
if (from) { params.push(from); clauses.push(`b.booking_date >= $${params.length}`); }
if (to) { params.push(to); clauses.push(`b.booking_date <= $${params.length}`); }
if (status) { params.push(status); clauses.push(`b.status = $${params.length}`); }
if (facility_id) { params.push(facility_id); clauses.push(`b.facility_id = $${params.length}`); }

const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
const { rows } = await query(
`SELECT b.*, f.option_name, f.sport_name
FROM bookings b
JOIN facilities f ON f.id = b.facility_id
${where}
ORDER BY b.booking_date DESC, b.start_time DESC`,
params
);

return res.status(200).json({ bookings: rows });
} catch (err) {
console.error('List bookings error:', err);
return res.status(500).json({ error: 'Server error while fetching bookings.' });
}
}

async function handleCreate(req, res) {
try {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const {
facility_id, customer_name, customer_email, customer_phone,
booking_date, start_time, end_time, rate, payment_method, notes, status
} = body;

const missing = [];
if (!facility_id) missing.push('facility_id');
if (!customer_name) missing.push('customer_name');
if (!customer_email) missing.push('customer_email');
if (!customer_phone) missing.push('customer_phone');
if (!booking_date) missing.push('booking_date');
if (!start_time) missing.push('start_time');
if (!end_time) missing.push('end_time');
if (rate === undefined || rate === null || rate === '') missing.push('rate');

if (missing.length) {
return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(customer_email)) {
return res.status(400).json({ error: 'Invalid email address.' });
}
const phoneDigits = String(customer_phone).replace(/\D/g, '');
if (phoneDigits.length < 7) {
return res.status(400).json({ error: 'Invalid phone number.' });
}
const numericRate = Number(rate);
if (!Number.isFinite(numericRate) || numericRate < 0) {
return res.status(400).json({ error: 'Rate must be a valid non-negative number.' });
}

const bookingRef = generateBookingRef();

const { rows } = await query(
`INSERT INTO bookings
(booking_ref, facility_id, customer_name, customer_email, customer_phone,
booking_date, start_time, end_time, rate, amount, payment_method, status, source, notes)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,'manual',$12)
RETURNING *`,
[
bookingRef, facility_id, customer_name, customer_email, phoneDigits,
booking_date, start_time, end_time, numericRate,
payment_method || 'cash', status || 'confirmed', notes || null
]
);

return res.status(201).json({ booking: rows[0] });
} catch (err) {
if (err && err.code === '23505') {
return res.status(409).json({ error: 'That date and time slot is already booked for this facility.' });
}
console.error('Create booking error:', err);
return res.status(500).json({ error: 'Server error while creating booking.' });
}
}
