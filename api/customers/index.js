// Vercel Serverless Function: Customers list, derived from booking history.
// Groups bookings by customer email so the admin can see each customer's
// total visits and spend, and search by name/email/phone.

import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
const user = requireAuth(req, res);
if (!user) return;

if (req.method !== 'GET') {
res.setHeader('Allow', 'GET');
return res.status(405).json({ error: 'Method not allowed' });
}

try {
const { search } = req.query || {};
const params = [];
let searchClause = '';
if (search) {
params.push(`%${search}%`);
searchClause = `WHERE customer_name ILIKE $1 OR customer_email ILIKE $1 OR customer_phone ILIKE $1`;
}

const { rows } = await query(
`SELECT
customer_name,
customer_email,
customer_phone,
COUNT(*) AS total_bookings,
SUM(amount) FILTER (WHERE status IN ('confirmed','completed')) AS total_spent,
MAX(booking_date) AS last_booking_date
FROM bookings
${searchClause}
GROUP BY customer_name, customer_email, customer_phone
ORDER BY last_booking_date DESC`,
params
);

return res.status(200).json({ customers: rows });
} catch (err) {
console.error('List customers error:', err);
return res.status(500).json({ error: 'Server error while fetching customers.' });
}
}
