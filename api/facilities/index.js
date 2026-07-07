// Vercel Serverless Function: Consolidated facilities endpoints.
// Combines list/create and single-facility update into one file to stay
// within the Vercel Hobby plan's 12-function limit. Vercel's optional
// catch-all dynamic route ([[...slug]].js) did not reliably match the bare
// path or sub-path segments on this project, so routing here is done via a
// query parameter instead:
// /api/facilities            (GET list - PUBLIC, POST create - admin only)
// /api/facilities?id=123     (PATCH update - admin only)
import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleList(req, res);
  }

const user = await requireAuth(req, res);
  if (!user) return;

const { id } = req.query;
  if (id) return handleUpdate(req, res, id);

if (req.method === 'POST') return handleCreate(req, res);

res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req, res) {
  try {
    const rows = await query('SELECT * FROM facilities ORDER BY sport_key, option_name');
    const UNLAUNCHED_SPORTS = ['cricket', 'pickleball']; // keep in sync with SPORT_META in assets/js/booking.js
          const facilities = rows.rows.map(function (f) {
                    if (UNLAUNCHED_SPORTS.indexOf(f.sport_key) !== -1) {
                                return Object.assign({}, f, { base_price: null, peak_price: null });
                    }
                    return f;
          });
          return res.status(200).json({ facilities: facilities });
  } catch (err) {
    console.error('List facilities error:', err);
    return res.status(500).json({ error: 'Server error while fetching facilities.' });
  }
}

async function handleCreate(req, res) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { sport_key, sport_name, option_id, option_name, base_price, peak_price } = body;
    if (!sport_key || !sport_name || !option_id || !option_name || base_price === undefined) {
      return res.status(400).json({ error: 'sport_key, sport_name, option_id, option_name and base_price are required.' });
    }
    const rows = await query(
      'INSERT INTO facilities (sport_key, sport_name, option_id, option_name, base_price, peak_price) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [sport_key, sport_name, option_id, option_name, base_price, peak_price || base_price]
      );
    return res.status(201).json({ facility: rows.rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'A facility with that option_id already exists.' });
    }
    console.error('Create facility error:', err);
    return res.status(500).json({ error: 'Server error while creating facility.' });
  }
}

async function handleUpdate(req, res, id) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const allowed = ['option_name', 'base_price', 'peak_price', 'is_active'];
    const sets = [];
    const params = [];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        params.push(body[key]);
        sets.push(key + ' = $' + params.length);
      }
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }
    params.push(id);
    const rows = await query(
      'UPDATE facilities SET ' + sets.join(', ') + ' WHERE id=$' + params.length + ' RETURNING *',
      params
      );
    if (rows.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found.' });
    }
    return res.status(200).json({ facility: rows.rows[0] });
  } catch (err) {
    console.error('Update facility error:', err);
    return res.status(500).json({ error: 'Server error while updating facility.' });
  }
}
