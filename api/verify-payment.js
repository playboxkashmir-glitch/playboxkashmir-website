// Vercel Serverless Function: verify a Razorpay payment signature
// Uses RAZORPAY_KEY_SECRET from environment variables to validate the HMAC-SHA256
// signature returned by Razorpay Checkout. Never trusts the client's claim of success.

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({ error: 'Payment gateway is not configured.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment fields.' });
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    // Constant-time comparison to avoid timing attacks
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    const verified = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!verified) {
      return res.status(400).json({ verified: false, error: 'Signature verification failed.' });
    }

    return res.status(200).json({ verified: true, payment_id: paymentId, order_id: orderId });
  } catch (err) {
    return res.status(500).json({ verified: false, error: 'Server error during verification.' });
  }
}
