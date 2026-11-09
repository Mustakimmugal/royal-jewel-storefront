# Royal Jewellers backend

This folder contains the Node.js/Express API and MongoDB models. The React/Vite frontend is in the sibling folder frontend.

## Run locally

Requirements: Node.js 20 or newer and MongoDB local or Atlas.

~~~powershell
npm install
Copy-Item .env.example .env
~~~

Set MONGODB_URI in .env. The database path should be royal_jawellars. The API also reads MONGODB_URI from the sibling frontend/.env; backend/.env takes precedence.

In local development, EMAIL_MODE=console prints password reset links in the backend terminal. For live password recovery, set EMAIL_MODE=resend, RESEND_API_KEY, and EMAIL_FROM for a verified Resend sender.

Product and profile photo uploads use Cloudinary's signed upload API. Royal's local `.env` contains the Cloudinary settings from the M3L checkout. When setting up another environment, add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to `backend/.env`. Uploads accept JPG, PNG, WebP, and AVIF images up to 5 MB each.

Start the API:

~~~powershell
npm run dev
~~~

The API listens on http://localhost:4000. Check http://localhost:4000/api/health.

## Admin account

Register an account normally, then set that user's `role` to `admin` in MongoDB. Admin role grants full dashboard access; employee accounts remain permission-scoped. Public registration always creates customer accounts only. Sign out and back in after changing the role so the new role is loaded.

## Current API

- Product list/detail and permission-protected product create/edit/archive
- Email/password registration/sign-in with scrypt password hashes, signed access JWTs, rotating refresh cookie, logout
- One-time email reset links with recovery questions and rate-limited attempts
- Authenticated COD order creation with server-side price and stock checks
- Admin order listing, fulfilment transitions, and manual COD payment status
- Persistent customer cart and wishlist, saved delivery addresses, and coupon creation/application
- Customer order cancellation and return requests, with admin review
- Cloudinary-backed product image uploads, customer management, product filters, similar products, and reviews
- Public contact form saved to MongoDB, with an admin inbox and message status updates
- Newsletter email subscriptions saved to MongoDB (email delivery campaigns are not connected yet)
- MongoDB models for users, password reset challenges, refresh sessions, products, orders, contact messages, and newsletter subscribers
- Helmet, CORS, compression, rate limits, and structured request logs

Online payment providers, SMS credentials, media uploads, Redis rate-limit storage, and deployment remain unconfigured.
