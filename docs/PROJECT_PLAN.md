# MH JEWELLERS — project blueprint

## Confirmed product decisions

- Brand name: **MH JEWELLERS**.
- Visitors can browse products without an account.
- Customers use email and password. Passwords and recovery answers are stored as one-way hashes; JWTs are used only for authenticated sessions.
- Password recovery uses a single-use email link plus two saved recovery answers. Admin role is assigned directly to the user record in MongoDB.
- Backend database: MongoDB.
- Storefront: React, Vite, Tailwind CSS; TypeScript is planned for the application migration.
- Admin dashboard includes catalogue, orders, customers, inventory, appointments, CMS, reporting, access control, logs, backups, and import/export.

## Phase 1 — Brand identity

### Visual direction

Premium, timeless, considered jewellery presentation. Use warm ivory and deep black as the main surfaces, royal gold for emphasis, emerald sparingly for luxury accents, and rose gold or diamond silver only where they serve the product or packaging.

### Working design tokens

| Token | Hex | Use |
|---|---|---|
| Royal Gold | `#B08D57` | Primary highlights, actions, fine rules |
| Deep Black | `#171512` | Main text, dark surfaces |
| Warm White | `#FAF8F4` | Main page background |
| Emerald Green | `#145A45` | Select luxury accents |
| Rose Gold | `#B76E79` | Optional collection/packaging accent |
| Diamond Silver | `#C9C7C3` | Subtle borders and product details |

Typography currently uses Playfair Display for display text and DM Sans for body text. Logo artwork, packaging, and a finished brand guide remain design deliverables.

### Brand copy guardrail

The existing story and product material claims are sample copy. Confirm the real business history, sourcing, craftsmanship, hallmark/certification, contact details, and return policy before presenting them as factual store claims.

## Phase 2 — Product and system requirements

### Customer flow

1. Browse catalogue as a guest.
2. Add products to a cart and optionally save a wishlist.
3. Start checkout; enter a mobile number and verify the one-time code.
4. Preserve/merge the guest cart after verification.
5. Confirm delivery address, shipping, coupon, and final total.
6. Create the order and track its payment and fulfilment status.

### Core MongoDB collections

- `users` — customer identity, verified mobile, profile, addresses, membership and reward balance.
- `admins`, `roles` — staff identity and explicit permissions.
- `products`, `categories`, `collections` — catalogue, variants, SEO and media references.
- `goldRates` — purity, currency, rate, source and effective time.
- `carts`, `wishlists` — customer or guest-session selections.
- `coupons` — validity, limits and eligibility.
- `orders`, `payments`, `invoices` — immutable item/price/gold-rate snapshots and lifecycle state.
- `reviews`, `appointments`, `supportTickets`, `messages` — customer service workflows.
- `blogs`, `banners`, `gallery`, `storeSettings` — editable site content and configuration.
- `adminLogs`, `notifications` — audit trail and delivery state.

Product/order history should be preserved with archival or soft deletion. Never store raw card details. Password reset links must be random, single-use, short-lived, and rate-limited. Recovery answers are hashed and are only accepted after the email reset link is validated.

### Order states

`Pending → Processing → Packed → Shipped → Delivered`, with explicit `Cancelled` and `Refund` paths. Payment state is tracked separately from fulfilment state.

### Admin roles

Use least-privilege roles, for example Owner, Catalog Manager, Order Manager, Inventory Manager, and Support. Record sensitive changes in an append-only admin activity log.

## Delivery sequence

1. Brand and requirements blueprint.
2. Frontend foundation and desktop/mobile storefront refinement.
3. Express API, MongoDB models, validation, and authentication.
4. Product, cart, checkout, order, and payment workflows.
5. Admin dashboard and permissions.
6. Messaging, analytics, backups, deployment, and launch readiness.

## Business decisions needed before accepting live orders

- Final product catalogue, real photos, prices, stock, materials, certificates, and hallmark claims.
- Operating country/currency, delivery regions, tax and return policies.
- Payment provider, shipping provider, and transactional email provider for password-reset links.
- Real business contact details, legal entity details, and final brand story.


## Implementation progress

- Applied the confirmed MH JEWELLERS name and working design tokens to the existing storefront.
- Added the TypeScript entry point, strict TypeScript configuration, and typed API client. Existing React screens remain JavaScript for an incremental migration.
- Added Express/Mongoose user, product, password-reset, refresh-session, and order models with API routes for products, email/password authentication, and COD orders.
- Connected storefront catalog pages to API results with the current sample catalog as an offline fallback.
- Added email/password login, hashed recovery answers, email-link password recovery, and a checkout route. The API calculates totals and reserves stock from MongoDB records.
- Local password-reset links are printed by the backend in development. Configure the email provider for live delivery. Online payments and advanced admin modules remain pending.

- Added root-level run scripts and moved the project plan into docs.
- Added a customer account page connected to the authenticated order-history endpoint.
- Made the parent folder the Git root so frontend and backend belong to the same project repository.
