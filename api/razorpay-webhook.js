// Vercel Serverless Function: Razorpay Webhook handler
// Verifies the X-Razorpay-Signature header using RAZORPAY_WEBHOOK_SECRET,
// then acknowledges events like payment.captured, payment.failed, order.paid.
//
// IMPORTANT: Signature verification requires the EXACT raw request body bytes,
// so automatic JSON body-parsing is disabled below and we read the raw stream.

import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false
  }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook secret is not configured.' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    return res.status(400).json({ error: 'Could not read request body.' });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    return res.status(400).json({ error: 'Missing signature header.' });
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  const verified = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!verified) {
    return res.status(400).json({ error: 'Invalid webhook signature.' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }

  const eventType = event && event.event;

  // Log the verified event for now (visible in Vercel's function logs).
  // There is no database configured yet, so we cannot persist booking status here.
  // See project notes: consider adding storage if you want webhook events
  // to automatically update booking records.
  console.log('Verified Razorpay webhook event:', eventType);

  switch (eventType) {
    case 'payment.captured':
    case 'order.paid':
    case 'payment.failed':
      // Acknowledge receipt. Add persistence/notifications here if needed.
      break;
    default:
      // Unrecognized event type; still acknowledge so Razorpay doesn't retry.
      break;
  }

  return res.status(200).json({ received: true });
}
