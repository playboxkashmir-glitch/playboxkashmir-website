// Sends booking confirmation emails via SMTP (nodemailer).
// Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM)
// to be set in your environment. Works with any SMTP provider (Gmail, SendGrid,
// Mailgun, Zoho, Amazon SES SMTP, etc.) - just supply your own credentials.

import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
if (!transporter) {
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
throw new Error('SMTP environment variables are not fully configured.');
}
transporter = nodemailer.createTransport({
host: SMTP_HOST,
port: Number(SMTP_PORT),
secure: Number(SMTP_PORT) === 465,
auth: { user: SMTP_USER, pass: SMTP_PASS }
});
}
return transporter;
}

function escapeHtml(str) {
return String(str).replace(/[&<>"']/g, (c) => ({
'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
}

export async function sendBookingConfirmationEmail(booking) {
const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
const t = getTransporter();

const subject = `Booking Confirmed - ${booking.booking_ref} | PlayBox Kashmir`;
const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
<h2 style="color:#15803d;">Booking Confirmed</h2>
<p>Hi ${escapeHtml(booking.customer_name)},</p>
<p>Your slot at <strong>PlayBox Kashmir</strong> is confirmed. Details below:</p>
<table style="width:100%; border-collapse: collapse;">
<tr><td style="padding:4px 0;color:#666;">Booking ID</td><td style="padding:4px 0;"><strong>${booking.booking_ref}</strong></td></tr>
<tr><td style="padding:4px 0;color:#666;">Facility</td><td style="padding:4px 0;">${escapeHtml(booking.option_name || '')}</td></tr>
<tr><td style="padding:4px 0;color:#666;">Date</td><td style="padding:4px 0;">${booking.booking_date}</td></tr>
<tr><td style="padding:4px 0;color:#666;">Time</td><td style="padding:4px 0;">${booking.start_time} - ${booking.end_time}</td></tr>
<tr><td style="padding:4px 0;color:#666;">Amount</td><td style="padding:4px 0;">Rs. ${booking.amount}</td></tr>
</table>
<p style="margin-top:16px;">See you on the turf!</p>
<p style="color:#999;font-size:12px;">PlayBox Kashmir</p>
</div>
`;

await t.sendMail({
from: fromAddress,
to: booking.customer_email,
subject,
html
});
}
