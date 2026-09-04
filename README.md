# ÉLAN Homme — Backend

Node.js + Express + TypeScript + MongoDB (Mongoose) backend for the ÉLAN Homme
magazine subscription platform. Payments run through **Mollie**.

## Stack
- Express 4 + TypeScript
- MongoDB / Mongoose
- JWT auth (bcrypt password hashing)
- Mollie API client (checkout + recurring payments via mandates)
- Nodemailer (transactional emails)
- node-cron (renewal reminders + auto-renewal/expiry)
- Multer (magazine covers + issue PDFs)

## Setup
```bash
npm install
cp .env.example .env   # fill in MongoDB URL, JWT secret, Mollie key, SMTP creds
npm run seed:admin      # creates an admin user (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
npm run dev
```

Mollie test API keys and a webhook-testing tunnel (e.g. `ngrok`) are enough to
try the full checkout flow locally — set `MOLLIE_WEBHOOK_URL` to the tunnel URL.

## Module map
| Module | Responsibility |
|---|---|
| `auth` | signup, login, forgot/reset/change password (JWT) |
| `user` | get/update own profile |
| `magazine` | admin CRUD for magazine titles + per-country pricing |
| `subscription` | create self/gift subscription, list mine, cancel, manual renew |
| `payment` | Mollie webhook — the only source of truth for payment state |
| `issue` | admin uploads a PDF issue → auto-notifies active subscribers; subscribers list/download |
| `help` | contact form → emails support inbox directly, no ticket storage (per spec) |

## Key flows
- **Checkout**: `POST /api/v1/subscriptions` creates a `pending` subscription
  and a Mollie payment (`sequenceType: first`), returning `checkoutUrl` for
  the frontend to redirect to. Mollie's webhook (`POST /api/v1/payments/webhook`)
  is what actually activates the subscription once payment succeeds — never
  trust the browser redirect alone.
- **Recurring**: the first payment sets up a Mollie *mandate*, stored as
  `mollieMandateId` on the subscription. Renewals reuse that mandate
  (`sequenceType: recurring`) so the subscriber isn't redirected again.
- **Auto-renewal / expiry**: a daily cron job renews subscriptions with
  `autoRenew: true` and a mandate on file, or marks them `expired` and emails
  the subscriber otherwise. It also sends a reminder 7 days before renewal.
- **Cancellation** takes effect immediately (`status: cancelled`,
  `autoRenew: false`) rather than at period end — simplest behavior for phase 1;
  flag if you'd rather it run out the paid period first.

## Not included (by design, per the requirement doc)
- Help-desk ticket storage/tracking — emails support directly instead.
- Multi-language content — English only for now.
- Cloud file storage — covers/issues are saved to local `/uploads`; swap
  `middlewares/upload.ts` for S3/Cloudinary when moving off a single instance.