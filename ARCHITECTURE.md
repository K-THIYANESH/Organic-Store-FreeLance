# GoOrganic architecture

Vanilla HTML, CSS, and JavaScript. There is no React or Next.js app to rewrite. Feature folders keep the finished intro, login, and storefront stable while payments, Porter, and admin land in their own files.

## Who owns what

| Folder | Owner | What lives here |
| --- | --- | --- |
| `index.html`, `src/intro/` | Intro | Brand page, hero, section routing on `/` |
| `src/auth/` | Auth | Login screen styles. Session handlers still run from `src/intro/app.js` because they share `index.html`. |
| `home.html`, `src/storefront/` | Storefront | Post-login shop: hero, categories, products, reviews, cart modal |
| `src/shared/styles/base.css` | Shared | Design tokens (`--forest`, `--gold`, type). Do not restyle these for new modules. |
| `src/shared/components/ui/` | Shared | Buttons, badges, drawers, modal primitives (`components.css`) |
| `src/shared/components/layout/` | Shared | Footer and newsletter styles |
| `src/shared/lib/` | Shared | `apiRequest`, `formatINR`, `formatDateIN`, `escapeHtml` |
| `src/shared/types/domain.js` | Shared | `User`, `Product`, `CartItem`, `DeliveryAddress`, `PorterDeliveryInfo`, `Order` |
| `src/cart/` | Shared cart | Reads and writes `localStorage['goorganic-cart']` |
| `src/checkout-payment/` | Payments teammate | `/checkout` page and `createPaymentOrder()` |
| `src/delivery-porter/` | Porter teammate | `/delivery` tracker and quote/dispatch client |
| `src/admin/` | Admin teammate | `/admin`, loaded only after `role === 'admin'` |
| `api/`, `server/` | Backend | Serverless handlers and the price book |

`/admin` and `/checkout` are separate documents. Their scripts are loaded with dynamic `import()`, so the landing page does not download them.

## How the contracts connect

The shopper's cart is a map of `{ [productId]: quantity }` under `goorganic-cart`. `CartItem` is that pair. It does not include a price.

Checkout posts only `productId` and `quantity` to `POST /api/checkout/create-order`. `server/catalog.js` looks up the rupee price, adds delivery (free from ₹500, otherwise ₹50), and returns `total` plus `amountPaise` for the gateway. Client `price` or `amount` fields are rejected.

An `Order` is that priced cart plus `deliveryAddress`, `paymentStatus`, and an optional `porter` block (`PorterDeliveryInfo`). Admin dispatch should read the order id and call `POST /api/porter/create-order` after payment is confirmed. The storefront's existing cart modal is unchanged and still demos checkout in the browser.

`User` is `localStorage['goorganic-user']` (`name`, `email`, `phone`). Admin additionally requires `role: "admin"`. Customer login does not grant that role.

## Vercel environment variables

In the Vercel project, set these for Production (and Preview if you test payments). Leave them empty in the browser bundle. This repo has no `VITE_*` or `NEXT_PUBLIC_*` keys.

| Name | Where it is used |
| --- | --- |
| `RAZORPAY_KEY_ID` | Server, when creating a gateway order |
| `RAZORPAY_KEY_SECRET` | Server only |
| `RAZORPAY_WEBHOOK_SECRET` | `POST /api/checkout/verify-webhook` HMAC |
| `PORTER_API_KEY` | `POST /api/porter/get-quote` and `create-order` |
| `PORTER_API_BASE_URL` | Porter host from their dashboard |
| `DATABASE_URL` | Future order and catalogue store |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Future session signing |
| `FRONTEND_URL` | Allowed origin for callbacks |

Copy `.env.example` for the full list. `.gitignore` ignores `.env` and `.env.*` except `.env.example`.

Point Razorpay's webhook at `https://<your-domain>/api/checkout/verify-webhook`. Fulfill orders from that signed request, not from the browser redirect.

## Local commands

```bash
npm run dev        # http://127.0.0.1:3000  (/login, /checkout, /admin rewrite like Vercel)
npm run build      # syntax check, secret scan, server price check
```

## Deploy checklist

1. Import the repo on Vercel. Framework preset: Other. Build command: `npm run build`. Do not set an output directory; the site and `/api` functions ship from the project root.
2. Add the environment variables above. Do not mark the secret keys as exposed to the browser.
3. Confirm `/`, `/login`, `/home`, `/checkout`, and `/admin` load without a 404 on refresh.
4. `/assets/*` is cached as immutable. Replace an image by using a new filename.
5. Keep intro and storefront edits inside `src/intro`, `src/auth`, and `src/storefront`. Payments, Porter, and admin stay in their own folders.
