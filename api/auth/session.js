// Vercel Serverless Function: Returns whether the current admin session is valid.
// Used by the dashboard pages to guard access and show the logged-in username.

import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
if (req.method !== 'GET') {
res.setHeader('Allow', 'GET');
return res.status(405).json({ error: 'Method not allowed' });
}
const user = requireAuth(req, res);
if (!user) return;
return res.status(200).json({ authenticated: true, username: user.username });
}
