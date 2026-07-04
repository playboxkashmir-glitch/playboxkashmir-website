# PlayBox Kashmir - Admin Backend

This document explains the backend that powers the Admin Panel (`/admin`).
It is built as Vercel Serverless Functions under `/api`, matching the existing
`create-order.js` / `razorpay-webhook.js` pattern already used in this project.

## What was added

- `lib/db.js` - PostgreSQL connection pool.
- `lib/auth.js` - password hashing, JWT sessions, httpOnly cookies, login lockout.
- `lib/email.js` - booking confirmation emails via SMTP (nodemailer).
- `db/schema.sql` - full database schema + seed data for facilities.
- `api/auth/login.js`, `logout.js`, `session.js` - secure admin authentication.
- `api/bookings/index.js`, `[id].js`, `availability.js`, `send-confirmation.js` - the bookings module, including the manual 'Add Booking' flow and slot-blocking.
- `api/facilities/index.js`, `[id].js` - facilities/courts + pricing module.
- `api/promos/index.js`, `[id].js` - promo codes module.
- `api/customers/index.js` - customer list derived from booking history.
- `api/reports/summary.js` - dashboard stats (today/week/month/by sport).
- `api/settings/index.js` - generic site settings module.
- `scripts/create-admin.mjs` - one-time script to seed your first admin login.

## 1. Create a PostgreSQL database

Use any Postgres provider you like, for example Vercel Postgres, Neon, Supabase,
or Railway. Copy the connection string it gives you (it looks like
`postgres://user:password@host:5432/dbname`).

## 2. Run the schema

From your own computer, with `psql` installed:

```
psql "$DATABASE_URL" -f db/schema.sql
```

This creates all tables (`admin_users`, `facilities`, `promo_codes`, `bookings`,
`settings`) and seeds the facilities to match the existing booking page.

## 3. Set environment variables in Vercel

Go to your Vercel Project -> Settings -> Environment Variables and add every
variable listed in `.env.example` (DATABASE_URL, JWT_SECRET, SMTP_*). Use a
long random value for `JWT_SECRET` (e.g. `openssl rand -base64 48`).

## 4. Create your admin login

From your own computer (not on Vercel):

```
npm install
DATABASE_URL="..." ADMIN_USERNAME="admin" ADMIN_PASSWORD="a-strong-password" node scripts/create-admin.mjs
```

This hashes your chosen password with bcrypt and stores it in `admin_users`.
The old hardcoded `admin` / `playbox2024` login in `admin/login.html` has been
replaced with a real API call - that demo password no longer works.

## 5. Deploy

Push/commit to `main` (already done) and let Vercel redeploy. Vercel will run
`npm install` automatically because `package.json` now lists the required
dependencies (`pg`, `bcryptjs`, `jsonwebtoken`, `nodemailer`).

## How booking confirmation emails work

Every booking (manual or online) is stored in the `bookings` table with the
customer's email and phone. Call `POST /api/bookings/send-confirmation` with
`{ "booking_id": 123 }` to email that customer their confirmation - this can be
triggered right after creating a booking, or later from a 'Resend confirmation'
button. You can also query `GET /api/bookings?date=YYYY-MM-DD` at any time to
retrieve confirmed bookings and their contact details.

## Preventing double-booking

The `bookings` table has a unique index on `(facility_id, booking_date, start_time)`
for any booking that is `reserved` or `confirmed`. If two requests ever tried to
book the same facility/date/time at once, the database itself rejects the second
one with a 409 error - this is safer than checking availability in application
code alone.

## Limitations / what you still need to do

- You must create the Postgres database and SMTP account yourself (an AI
assistant cannot create third-party accounts on your behalf).
- The old front-end demo login and static dashboard numbers should be wired up
to call these new endpoints (see the updated `admin/login.html`,
`admin/dashboard.html`, and `admin/admin.js` for the Dashboard + Add Booking
integration already done).
- Consider adding a proper rate-limiter (e.g. Vercel Firewall rules) in front of
`/api/auth/login` for extra protection against brute-force attempts, in
addition to the built-in lockout.
