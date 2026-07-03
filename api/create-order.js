// Vercel Serverless Function: create a Razorpay order
// Uses RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from environment variables.
// The secret is NEVER exposed to the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Payment gateway is not configured.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const amount = Number(body.amount);
    const currency = body.currency || 'INR';

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }

    const auth = Buffer.from(keyId + ':' + keySecret).toString('base64');
    const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + auth
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        receipt: body.receipt || undefined,
        notes: body.notes || {}
      })
    });

    const data = await rpRes.json();
    if (!rpRes.ok) {
      const message = (data && data.error && data.error.description) || 'Order creation failed.';
      return res.status(rpRes.status).json({ error: message });
    }

    return res.status(200).json({ id: data.id, amount: data.amount, currency: data.currency });
  } catch (err) {
    return res.status(500).json({ error: 'Server error while creating order.' });
  }
}
