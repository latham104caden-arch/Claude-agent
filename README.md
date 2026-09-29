# Revised Research — storefront

Next.js storefront for **Revised Research**, deployed on Vercel. The site structure is modeled on the Ventra Sciences storefront (same stack, same page map and home section order), rebuilt from scratch with the Revised Research brand.

**Status: bones only.** Every page renders and the cart works in the browser. **Nothing external is connected yet**: no payments, database, email, or SMS.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Plain CSS with brand tokens (`styles/tokens.css`) |
| Fonts | Inter + Manrope, self-hosted through Fontsource (no build-time network fetch) |
| Hosting | Vercel |
| Planned | Neon Postgres + Drizzle, Stripe, Resend (transactional), ShipStation |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # typecheck + RUO name scan
npm run build      # production build
```

Node 22.6 or newer. No env vars are needed yet. `.env.example` lists the future ones.

## Deploy to Vercel (Caden Latham account)

1. Sign in at vercel.com as **latham104.caden@gmail.com** (GitHub `latham104caden-arch`).
2. **Add New → Project → Import** this GitHub repo.
3. Framework preset: **Next.js**. Leave the build settings at their defaults. No env vars are needed.
4. Deploy. Pushes to the production branch deploy production; other branches get Preview URLs.
5. Later: add the domain under **Project → Settings → Domains** and set `NEXT_PUBLIC_SITE_URL`.

## Brand tokens (v2: silver · slate blue · white)

| Token | Hex | Use |
|---|---|---|
| `--bg` / `--surface` | `#FFFFFF` | page background, cards |
| `--surface-soft` | `#F4F6F8` | cool off-white panels |
| `--surface-alt` | `#E9EDF1` | chips, wells |
| `--ink` | `#26303D` | headings, nav, body text |
| `--accent` | `#6F86A0` | grayish blue: buttons, icons |
| `--accent-ink` | `#4A6079` | grayish blue text on white |
| `--accent-soft` | `#E6ECF2` | badge and callout backgrounds |
| `--silver` | `#C4CBD3` | silver gray: metal, dividers, sheen |
| `--text-muted` | `#647080` | secondary text |
| `--border` | `#D9DEE4` | dividers, card borders |

Signature look: soft, out-of-focus slate and silver backdrops (`--blur-light`, `--blur-dark`) with film grain, plus frosted-glass panels (`.glass`). Components never hard-code a hex value. If you need a new color, add a token.

## Page map

| Route | What it is |
|---|---|
| `/` | Home: Hero → Ticker → Categories → COA band → Best Sellers → Quality Control → Reviews → Why Us → Newsletter |
| `/shop` | All products, with category tabs, search and sort (`?tab=` in the URL) |
| `/product-category/[slug]` | Category listing |
| `/product/[slug]` | Product page: size picker, qty, add to cart, specs, storage, sources, related products |
| `/coas` | Certificate-of-analysis table (`/coas#LOT` highlights a row) |
| `/about`, `/faq`, `/contact` | Company and support pages |
| `/membership`, `/affiliate` | Program pages (join and apply are stubbed) |
| `/research`, `/research/[slug]` | Research library |
| `/cart`, `/checkout` | Cart and checkout layout (**Place Order is disabled**) |
| `/my-account` | Sign-in shell (disabled) |
| `/privacy-policy`, `/shipping-policy`, `/refund-policy`, `/terms`, `/disclaimer` | Legal pages (**draft text**) |
| `/sitemap.xml`, `/robots.txt`, 404 | SEO basics |

Site-wide: sticky header, full-screen mobile menu, search overlay (⌘K), slide-out cart drawer with a free-shipping meter, researcher verification gate (21+ and research use only), and a footer with the RUO disclaimer.

## Where things live

```
app/                 routes (App Router)
components/chrome/   header, footer, search, entry gate, scroll reveal
components/cart/     cart state (localStorage), drawer, qty stepper
components/product/  product card, shop filters, PDP buy box
components/home/     homepage sections
components/forms/    newsletter / contact / partner forms (stubbed)
components/checkout/ cart view, checkout form, order summary
data/products.ts     PLACEHOLDER catalog: replace with the real one
data/content.ts      FAQ, COA table, articles, homepage copy
data/legal.ts        DRAFT legal copy: replace with counsel-reviewed text
lib/site.ts          brand name, nav, footer links, support email, disclaimers
lib/catalog.ts       the only way pages read products (swap in a DB here)
lib/ruo.ts           drops any product that uses a banned compound name
styles/              tokens, base, chrome, home, shop, pages
```

## Not connected yet (on purpose)

| Thing | Current behavior | Where to wire it |
|---|---|---|
| Newsletter / email marketing | Form posts to `/api/newsletter` → 501 "not connected" | `app/api/newsletter/route.ts` |
| SMS marketing | Not present | n/a |
| Contact form | `/api/contact` → 501 | `app/api/contact/route.ts` |
| Partner applications | `/api/affiliate` → 501 | `app/api/affiliate/route.ts` |
| Payments | Place Order disabled | new `app/api/checkout/*` + Stripe |
| Accounts / sign-in | Disabled form | database + transactional email |
| Membership billing | "Coming soon" | Stripe subscriptions |
| Product photos | SVG vial art (`components/Vial.tsx`) | replace with `next/image` |
| COA PDFs | "PDF pending" | put files in `public/coas/` and set `pdf` in `data/content.ts` |

When checkout is wired, the server must re-price every cart line from the catalog. Cart prices in the browser are display-only.
