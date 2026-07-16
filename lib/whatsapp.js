// Sends WhatsApp booking confirmation messages via Meta's WhatsApp Cloud API.
// Requires WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars, plus the
// approved "booking_confirmation" message template in WhatsApp Manager.
// Best-effort: any failure here is logged but never blocks the booking flow.

const GRAPH_API_VERSION = 'v20.0';

function formatDateNice(dateVal) {
  var d = (dateVal instanceof Date) ? dateVal : new Date(dateVal);
  if (isNaN(d.getTime())) { return String(dateVal); }
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function formatTime12(t) {
  if (!t) return '';
  var parts = String(t).split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1] || '00';
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12;
  if (h12 === 0) { h12 = 12; }
  return h12 + ':' + m + ' ' + ampm;
}

// Normalizes an Indian phone number to the digits-only format WhatsApp's
// API expects (e.g. "918899449965"), no leading "+".
function normalizePhone(phone) {
  var digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 13 && digits.startsWith('091')) return '91' + digits.slice(3);
  return digits;
}

export async function sendBookingConfirmationWhatsApp(booking) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME, WHATSAPP_TEMPLATE_LANG } = process.env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp not configured; skipping WhatsApp confirmation.');
    return;
  }

  const to = normalizePhone(booking.customer_phone);
  if (!to) {
    console.warn('No valid customer phone for WhatsApp confirmation:', booking.booking_ref);
    return;
  }

  const firstName = String(booking.customer_name || 'there').split(' ')[0];

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: WHATSAPP_TEMPLATE_NAME || 'booking_confirmation',
      language: { code: WHATSAPP_TEMPLATE_LANG || 'en' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: firstName },
          { type: 'text', text: String(booking.booking_ref) },
          { type: 'text', text: String(booking.option_name || '') },
          { type: 'text', text: formatDateNice(booking.booking_date) },
          { type: 'text', text: formatTime12(booking.start_time) + ' - ' + formatTime12(booking.end_time) },
          { type: 'text', text: String(booking.amount) }
        ]
      }]
    }
  };

  const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`WhatsApp API error (${res.status}): ${errText}`);
  }
}
