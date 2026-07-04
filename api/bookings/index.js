// Vercel Serverless Function: Consolidated bookings endpoints.
// Combines list/create, single-booking get/update/cancel, availability check,
// and confirmation email sending into one file to stay within the Vercel
// Hobby plan's 12-function limit. Vercel's optional catch-all dynamic route
// ([[...slug]].js) did not reliably match the bare path or sub-path segments
// on this project, so routing here is done via query parameters instead:
// /api/bookings                                (GET list, POST create - admin only)
// /api/bookings?id=123                          (GET/PATCH/DELETE single - admin only)
// /api/bookings?resource=availability&date=..    (GET availability - PUBLIC)
// /api/bookings?resource=send-confirmation       (POST send confirmation email - admin only)
import { query } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { sendBookingConfirmationEmail } from '../../lib/email.js';

function generateBookingRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PBK-${ts}-${rand}`;
}

export default async function handler(req, res) {
  const { resource } = req.query;

// Slot availability must be readable by anonymous visitors on the public
// booking page, so this one resource is intentionally not behind requireAuth.
if (resource === 'availability') {
  return handleAvailability(req, res);
}

const user = await requireAuth(req, res);
  if (!user) return;

const { id } = req.query;
  if (resource === 'send-confirmation') {
    return handleSendConfirmation(req, res);
  }
  if (id) {
    return handleSingle(req, res);
  }
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);

res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleList(req, res) {
  try {
    const { date, from, to, status, facility_id } = req.query;
    const clauses = [];
    const params = [];
    if (date) {
      params.push(date);
      clauses.push(`b.booking_date = $${params.length}`);
    } else if (from) {
      params.push(from);
      clauses.push(`b.booking_date >= $${params.length}`);
      if (to) {
        params.push(to);
        clauses.push(`b.booking_date <= $${params.length}`);
      }
    }
    if (status) {
      params.push(status);
      clauses.push(`b.status = $${params.length}`);
    }
    if (facility_id) {
      params.push(facility_id);
      clauses.push(`b.facility_id = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await query(
      `SELECT b.*, f.option_name, f.sport_name
      FROM bookings b
      JOIN facilities f ON f.id = b.facility_id
      ${where}
      ORDER BY b.booking_date DESC, b.start_time DESC`,
      params
      );
    return res.status(200).json({ bookings: rows.rows });
  } catch (err) {
    console.error('List bookings error:', err);
    return res.status(500).json({ error: 'Server error while fetching bookings.' });
  }
}

async function handleCreate(req, res) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { facility_id, customer_name, customer_email, customer_phone, booking_date, start_time, end_time, rate, payment_method, notes, status } = body;
    const missing = [];
    if (!facility_id) missing.push('facility_id');
    if (!customer_name) missing.push('customer_name');
    if (!customer_email) missing.push('customer_email');
    if (!customer_phone) missing.push('customer_phone');
    if (!booking_date) missing.push('booking_date');
    if (!start_time) missing.push('start_time');
    if (!end_time) missing.push('end_time');
    if (rate === undefined || rate === null) missing.push('rate');
    if (missing.length) {
      return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    const phoneDigits = String(customer_phone).replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }
    const numericRate = Number(rate);
    if (!Number.isFinite(numericRate) || numericRate < 0) {
      return res.status(400).json({ error: 'Rate must be a valid non-negative number.' });
    }
    const bookingRef = generateBookingRef();
    const rows = await query(
      `INSERT INTO bookings
      (booking_ref, facility_id, customer_name, customer_email, customer_phone,
      booking_date, start_time, end_time, rate, amount, payment_method, status, source, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,$11,'manual',$12)
      RETURNING *`,
      [bookingRef, facility_id, customer_name, customer_email, phoneDigits, booking_date, start_time, end_time, numericRate, payment_method || 'cash', status || 'confirmed', notes || null]
      );
    return res.status(201).json({ booking: rows.rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'That date and time slot is already booked for this facility.' });
    }
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Server error while creating booking.' });
  }
}

async function handleSingle(req, res) {
  const { id } = req.query;
  if (req.method === 'GET') {
    try {
      const rows = await query('SELECT b.*, f.option_name, f.sport_name FROM bookings b JOIN facilities f ON f.id=b.facility_id WHERE b.id=$1', [id]);
      if (rows.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found.' });
      }
      return res.status(200).json({ booking: rows.rows[0] });
    } catch (err) {
      console.error('Get booking error:', err);
      return res.status(500).json({ error: 'Server error while fetching booking.' });
    }
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
    if (sets.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }
    params.push(id);
    const rows = await query(
      `UPDATE bookings SET ${sets.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
      params
      );
    if (rows.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.status(200).json({ booking: rows.rows[0] });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'That date and time slot is already booked for this facility.' });
    }
    console.error('Update booking error:', err);
    return res.status(500).json({ error: 'Server error while updating booking.' });
  }
}

if (req.method === 'DELETE') {
  try {
    const rows = await query(`UPDATE bookings SET status='cancelled', updated_at=now() WHERE id=$1 RETURNING *`, [id]);
    if (rows.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.status(200).json({ booking: rows.rows[0] });
  } catch (err) {
    console.error('Cancel booking error:', err);
    return res.status(500).json({ error: 'Server error while cancelling booking.' });
  }
}

res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleAvailability(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { date, facility_id } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD).' });
  }
  try {
    const params = [date];
    let facilityClause = '';
    if (facility_id) {
      params.push(facility_id);
      facilityClause = `AND facility_id = $${params.length}`;
    }
    const rows = await query(
      `SELECT facility_id, start_time, end_time, status, booking_ref
      FROM bookings
      WHERE booking_date = $1 AND status IN ('reserved','confirmed') ${facilityClause}`,
      params
      );
    return res.status(200).json({ blocked: rows.rows });
  } catch (err) {
    console.error('Availability error:', err);
    return res.status(500).json({ error: 'Server error while checking availability.' });
  }
}

async function handleSendConfirmation(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { booking_id } = body;
    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id is required.' });
    }
    const rows = await query('SELECT b.*, f.option_name, f.sport_name FROM bookings b JOIN facilities f ON f.id=b.facility_id WHERE b.id=$1', [booking_id]);
    const booking = rows.rows[0];
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    await sendBookingConfirmationEmail(booking);
    await query('UPDATE bookings SET confirmation_sent_at = now() WHERE id = $1', [booking_id]);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Send confirmation error:', err);
    return res.status(500).json({ error: 'Failed to send confirmation email. Check SMTP configuration.' });
  }
}
