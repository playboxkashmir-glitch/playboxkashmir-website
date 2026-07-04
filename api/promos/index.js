// Vercel Serverless Function: Consolidated promo codes endpoints.
// Combines list/create and single-promo update/delete into one file to stay
// within the Vercel Hobby plan's 12-function limit. Vercel's optional
// catch-all dynamic route ([[...slug]].js) did not reliably match the bare
// path or sub-path segments on this project, so routing here is done via a
// query parameter instead:
// /api/promos?validate=CODE  (GET - PUBLIC promo code validation for checkout)
// /api/promos                (GET list, POST create - admin only)
// /api/promos?id=123         (PATCH update, DELETE - admin only)
import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.validate) {
    return handleValidate(req, res);
  }

const user = await requireAuth(req, res);
  if (!user) return;

const { id } = req.query;
  if (id) return handleSingle(req, res, id);

if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);

res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

// Public: look up a single active promo code by name and return only the
// fields needed to apply a discount client-side. Never exposes the full list.
async function handleValidate(req, res) {
  try {
    const code = String(req.query.validate || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'A promo code is required.' });
    }
    const rows = await query(
      'SELECT code, type, value, min_amount FROM promo_codes WHERE code = $1 AND is_active = true',
      [code]
      );
    if (rows.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid promo code. Please try again.' });
    }
    return res.status(200).json({ promo: rows.rows[0] });
  } catch (err) {
    console.error('Validate promo error:', err);
    return res.status(500).json({ error: 'Server error while validating promo code.' });
  }
}

async function handleList(req, res) {
  const rows = await query('SELECT * FROM promo_codes ORDER BY created_at DESC');
  return res.status(200).json({ promos: rows.rows });
}

async function handleCreate(req, res) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { code, type, value, min_amount } = body;
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: 'code, type and value are required.' });
    }
    if (!['percent', 'flat'].includes(type)) {
      return res.status(400).json({ error: "type must be 'percent' or 'flat'." });
    }
    const rows = await query(
      'INSERT INTO promo_codes (code, type, value, min_amount) VALUES ($1,$2,$3,$4) RETURNING *',
      [code.toUpperCase(), type, value, min_amount || 0]
      );
    return res.status(201).json({ promo: rows.rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'A promo code with that name already exists.' });
    }
    console.error('Create promo error:', err);
    return res.status(500).json({ error: 'Server error while creating promo code.' });
  }
}

async function handleSingle(req, res, id) {
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const allowed = ['type', 'value', 'min_amount', 'is_active'];
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
        'UPDATE promo_codes SET ' + sets.join(', ') + ' WHERE id=$' + params.length + ' RETURNING *',
        params
        );
      if (rows.rows.length === 0) {
        return res.status(404).json({ error: 'Promo code not found.' });
      }
      return res.status(200).json({ promo: rows.rows[0] });
    } catch (err) {
      console.error('Update promo error:', err);
      return res.status(500).json({ error: 'Server error while updating promo code.' });
    }
  }

if (req.method === 'DELETE') {
  const rows = await query('DELETE FROM promo_codes WHERE id=$1 RETURNING *', [id]);
  if (rows.rows.length === 0) {
    return res.status(404).json({ error: 'Promo code not found.' });
  }
  return res.status(200).json({ success: true });
}

res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
