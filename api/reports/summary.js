// Vercel Serverless Function: Dashboard summary stats
// Returns today's bookings/revenue, this week, this month, and a breakdown by sport
// so the Admin Dashboard cards and charts can be powered by real data.

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
const today = await query(
`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS revenue
FROM bookings WHERE booking_date = CURRENT_DATE AND status IN ('confirmed','completed')`
);

const yesterday = await query(
`SELECT COUNT(*) AS count, COALESCE(SUM(amount),0) AS revenue
FROM bookings WHERE booking_date = CURRENT_DATE - INTERVAL '1 day' AND status IN ('confirmed','completed')`
);

const week = await query(
`SELECT COUNT(*) AS count FROM bookings
WHERE booking_date >= date_trunc('week', CURRENT_DATE) AND status IN ('confirmed','completed')`
);

const month = await query(
`SELECT COALESCE(SUM(amount),0) AS revenue FROM bookings
WHERE booking_date >= date_trunc('month', CURRENT_DATE) AND status IN ('confirmed','completed')`
);

const bySport = await query(
`SELECT f.sport_name, COUNT(*) AS count
FROM bookings b JOIN facilities f ON f.id = b.facility_id
WHERE b.status IN ('confirmed','completed')
GROUP BY f.sport_name
ORDER BY count DESC`
);

return res.status(200).json({
today: today.rows[0],
yesterday: yesterday.rows[0],
week: week.rows[0],
month: month.rows[0],
bySport: bySport.rows
});
} catch (err) {
console.error('Reports summary error:', err);
return res.status(500).json({ error: 'Server error while generating report summary.' });
}
}
