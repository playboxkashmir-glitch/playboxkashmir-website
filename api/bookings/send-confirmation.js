// Vercel Serverless Function: Sends (or re-sends) a booking confirmation email
// by looking up the stored booking record and emailing the customer via SMTP.

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { sendBookingConfirmationEmail } from '../../lib/email.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

if (req.method !== 'POST') {
res.setHeader('Allow', 'POST');
return res.status(405).json({ error: 'Method not allowed' });
}

try {
const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const { booking_id } = body;
if (!booking_id) return res.status(400).json({ error: 'booking_id is required.' });

const { rows } = await query(
`SELECT b.*, f.option_name, f.sport_name FROM bookings b JOIN facilities f ON f.id=b.facility_id WHERE b.id=$1`,
[booking_id]
);
const booking = rows[0];
if (!booking) return res.status(404).json({ error: 'Booking not found.' });

await sendBookingConfirmationEmail(booking);

await query(`UPDATE bookings SET confirmation_sent_at = now() WHERE id = $1`, [booking_id]);

return res.status(200).json({ ok: true });
} catch (err) {
console.error('Send confirmation error:', err);
return res.status(500).json({ error: 'Failed to send confirmation email. Check SMTP configuration.' });
}
}
