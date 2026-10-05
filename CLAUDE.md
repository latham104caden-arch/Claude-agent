# Revised Research storefront: working rules

- This is Caden Latham's project, deployed on **his own** Vercel account. It is separate from Ventra Sciences. Never push to or deploy under the Ventra repo or Kaseton's Vercel team.
- Stack: Next.js 15 App Router, React 19, TypeScript, plain CSS. Don't add Tailwind or a UI kit without asking.
- Colors come only from `styles/tokens.css`. No hard-coded hex values in components.
- Products are read only through `lib/catalog.ts`. `data/products.ts` is placeholder data.
- **Email marketing: Omnisend only** (owner-approved 2026-10-02): web tracking snippet in `components/chrome/Omnisend.tsx`, newsletter → Omnisend contacts in `app/api/newsletter/route.ts` (needs `OMNISEND_API_KEY`). **Transactional email: Resend** (owner-approved 2026-10-02) for account sign-in codes and (2026-10-03) order confirmations, from orders@revisedresearch.com with replies to support@ (`lib/email.ts`). **Web push "drop alerts"** (owner-approved 2026-10-05): browser-native push, no third-party provider; subscriptions in Vercel Blob (`lib/push.ts`), sent only via the owner-only `/api/push/send`; they unlock the RR25 first-order code (`components/offer/FirstOrderOffer.tsx`, enforced in `lib/discounts.ts`). **Do not connect SMS or any other messaging provider** until the owner approves it. The other form API routes are intentional 501 stubs (`lib/api/stub.ts`).
- Never commit `.env*`, `.vercel/`, or keys. Stage explicit paths. Never use `git add -A`, because iCloud "name 2" duplicates can sneak in.
- Before pushing: `npm run check && npm run build`.
- RUO: every customer-facing surface is "research use only". `lib/ruo.ts` and `scripts/check-ruo.mjs` block the names in `data/ruo-banned.json`. Never weaken either one.
- Reviews: publish only real, verified reviews. Never seed invented quotes.
- Legal pages are drafts until counsel-reviewed text replaces them.
