# GoOrganic — Customer-Facing Frontend

Premium organic e-commerce frontend for **GoOrganic Store — Anna Nagar, Chennai**.

Vanilla HTML5 / CSS3 / JavaScript. Intro + auth on `index.html`; full post-login shopping SPA on `home.html`. `npm run build` type-checks the scripts and the server price book.

---

## Quick start

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Feature ownership, API keys, and the Vercel checklist are in `ARCHITECTURE.md`.

1. Browse the intro experience on `index.html`
2. Sign in / sign up (client-side demo auth)
3. You are redirected to `home.html#home` — the shopping experience

Demo login accepts any email; signup requires a mobile number. Google sign-in is a mock that creates a demo user.

---

## Project structure

```text
goorganic-frontend/
├── index.html                 # Intro + auth
├── home.html                  # Post-login storefront
├── checkout.html              # Payments teammate entry (/checkout)
├── admin.html                 # Admin teammate entry (/admin)
├── delivery.html              # Porter teammate entry (/delivery)
├── api/                       # Vercel serverless stubs
├── server/                    # Price book + request validation
├── assets/images/
└── src/
    ├── intro/                 # Intro controller
    ├── auth/                  # Login styles
    ├── storefront/            # Catalogue, shop state, storefront styles
    ├── shared/                # Tokens, UI, layout, formatters, domain types
    ├── cart/                  # Shared cart persistence
    ├── checkout-payment/
    ├── delivery-porter/
    └── admin/
```

---

## Customer journey

```text
index.html (#home …) → #login / #signup → home.html#home
                                              ├─ #shop / #shop?cat=oils
                                              ├─ #wishlist  #cart
                                              ├─ #history   #track
                                              ├─ #help      #profile
```

Authenticated pages on `home.html` require `localStorage['goorganic-user']`. Missing session redirects to `index.html#login`.

---

## Post-login features

| Area | Behaviour |
|------|-----------|
| **Header** | Brand, product search with suggestions, profile avatar, My Cart + quantity badge |
| **Floating nav** | Home, Shop, Categories (dropdown of all 13), History, Help, Track Order, Wishlist |
| **Home** | 3-slide hero, category discovery, featured, bestsellers, curated collections, journal & reels |
| **Shop** | Sidebar filters (category, price, stock, offers, new, traditional), sort, grid/list, catalogue search |
| **Product** | Detail modal with qty, wishlist, related products |
| **Cart / Checkout** | Live totals; free delivery above ₹500 else ₹50; demo checkout + confirmation |
| **Wishlist** | Persist per browser; add all / add individual |
| **Orders** | Demo + local orders; search; View / Track / Buy Again / Modify → new cart |
| **Track** | Order ID or select recent; timeline by status; Porter slot is pending (no fake partner data) |
| **Help** | Distinct help search, FAQ categories, troubleshooting, contact card, support form + mailto draft |
| **Profile** | Personal info, addresses, security (demo), notifications, privacy, activity |
| **Newsletter / Footer** | Shared with intro page styling and store contact details |

---

## Design system (inherited from intro)

CSS variables in `src/shared/styles/base.css`:

- `--forest: #173f2b` · `--deep: #102f20` · `--leaf: #6c8c53`
- `--sage: #dce5d3` · `--cream: #f7f5ed` · `--paper: #fcfbf7`
- `--ink: #1c2c22` · `--muted: #788076` · `--line: #e5e7df` · `--gold: #c89b4b`

Fonts: **Playfair Display** (headlines), **DM Sans** (UI), **Outfit** (CTAs).

---

## Data & storage

| Key | Store | Purpose |
|-----|-------|---------|
| `goorganic-user` | localStorage | Auth session `{ name, email, phone }` |
| `goorganic-cart` | localStorage | `{ [productId]: qty }` |
| `goorganic-wishlist` | localStorage | `[productId, …]` |
| `goorganic-orders` | localStorage | Customer-placed orders (plus `DEMO_ORDERS` in UI) |
| `goo-addresses` | localStorage | Saved addresses |
| `goo-notif-prefs` | localStorage | Notification toggles |
| `goo-shop-view` | sessionStorage | `grid` \| `list` |
| `goo-browsed` | sessionStorage | Recently viewed product IDs |

Catalogue source of truth for the shopping SPA: `src/storefront/shop-data.js` (`GOORGANIC_CATEGORIES`, `GOORGANIC_PRODUCTS`). Server checkout prices live in `server/catalog.js`.

---

## API integration notes

The frontend is ready for a backend. Suggested contracts (not yet live — no `fetch` calls today):

| Domain | Endpoints |
|--------|-----------|
| Products | `GET /api/categories`, `GET /api/products`, `GET /api/products/:id` |
| Campaigns | `GET /api/campaigns/active` |
| Customer | `GET/PUT /api/customers/me`, addresses CRUD |
| Cart | `GET/POST/PUT/DELETE /api/cart…` |
| Wishlist | `GET/POST/DELETE /api/wishlist…` |
| Orders | `GET /api/orders/my-orders`, `GET /api/orders/:id`, `POST /api/orders` |
| Delivery | `GET /api/delivery/:orderId/tracking` |
| Support | `POST /api/support/tickets` |
| Newsletter | `POST /api/newsletter/subscribe` |

Wire these inside `ShopApp` / `shop-app.js` service helpers. Keep pricing and stock validation on the server for real checkout.

**Placeholders (intentionally demo):**

- Auth (no password verification / tokens)
- Razorpay / UPI online payment
- Porter live tracking credentials & partner details
- Newsletter persistence
- Support ticket API (form shows success toast; “Draft Email” opens mailto)

---

## Testing checklist

- [ ] Login / Google mock → lands on `home.html#home`
- [ ] Floating nav + Categories dropdown → Shop with filter
- [ ] Header search suggestions → product modal
- [ ] Shop filters, price range, sort, grid/list, mobile filter drawer
- [ ] Add to cart / wishlist across Home, Shop, modal
- [ ] Cart qty, remove, checkout → order appears in History
- [ ] Buy Again / Modify previous order
- [ ] Track by ID and from History
- [ ] Help search, FAQ accordion, draft email
- [ ] Profile save, addresses, logout
- [ ] Newsletter validation
- [ ] Mobile: sticky header + nav, no horizontal overflow

---

## Known limitations

1. **Demo catalogue** — 23 products in `shop-data.js` (intro page still shows a smaller marketing set).
2. **Client-only auth** — any credentials work; not production-secure.
3. **No live payments / Porter** — UI states are honest placeholders.
4. **Product imagery** — mostly Unsplash CDN URLs; local brand slides are under `assets/images/`.
5. **Index `#shop` still exists** as a legacy guest/logged-in shop on the intro page; the primary shopping destination after login is `home.html`.

---

## Store contact

**GoOrganic**  
No. GA/580, School Rd, Anna Nagar West Extn, Opposite to SBOA school, Chennai 600101.

Phone: +91 91760 28198 · Landline: 044 615 0609  
Email: goorganic101@gmail.com  
Hours: Daily, 9:30 AM – 9:00 PM
