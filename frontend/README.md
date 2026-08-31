# PayPilot AI — Frontend

Next.js (App Router) web app for PayPilot AI, styled with Tailwind CSS v4 and shadcn/ui.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + Radix primitives
- [GSAP](https://gsap.com/) for the hero entrance sequence
- [Motion](https://motion.dev/) for hover/tap micro-interactions
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for forms/validation
- [Recharts](https://recharts.org/) for charts
- [Embla Carousel](https://www.embla-carousel.com/), [Sonner](https://sonner.emilkowal.ski/) toasts, [lucide-react](https://lucide.dev/) icons

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Route map

PayPilot AI is a **single-tenant, merchant-facing** product (organizations, not
a buyer/seller marketplace) — see `documentation/Backend_API_Reference.md` at
the repo root for the full API contract every page below is grounded in.

### Public / marketing

Shared chrome: `components/marketing/MarketingPage.tsx` (Navbar + Footer).
Home (`/`) manages its own Navbar/Footer via `Hero`/`Footer` directly, so it
doesn't use this wrapper.

| Route | Purpose |
|---|---|
| `/` | Landing page (pre-existing, untouched) |
| `/about` | Product story — problem, vision, agentic commerce, security philosophy |
| `/agentic-commerce` | The four "example directions" from the problem statement, explained |
| `/demo`, `/demo/video` | Interactive walkthrough (agent chat / revenue opportunities / audit trail) and a video placeholder |
| `/docs`, `/docs/[slug]` | Documentation index + per-topic articles, grouped by real backend module (`lib/docs.ts`) |
| `/pricing` | Illustrative pricing tiers (no billing integration yet) |
| `/product/ai-agent` | Commerce Agent + AI Copilot |
| `/product/analytics` | Analytics engine, including the disclosed conversion-rate proxy |
| `/product/catalog` | Merchant catalog vs. agent-shaped catalog |
| `/product/checkout` | Server-computed totals, idempotency, webhook verification |
| `/product/revenue-engine` | The 5 detectors + transparent scoring formula |
| `/security` | Bounded/gated/audited principles, with a sample audit trail |
| `/status` | Static service-status placeholder (not wired to a real monitor) |
| `/contact` | Contact form shell (validated, not wired to a backend endpoint) |
| `/privacy-policy`, `/terms-and-conditions`, `/cookies` | Legal pages via `components/legal/LegalPage.tsx` |

### Auth (`/auth/*`)

Shared chrome: `components/auth/AuthShell.tsx`. No real authentication is
wired up yet — every form is a validated UI shell only. Zod schemas mirror
the backend's `auth.schemas.ts` exactly (register requires `organizationName`;
there is no buyer/seller choice — every account is `ORG_ADMIN` of a new org).

| Route | Purpose |
|---|---|
| `/auth/login` | Sign in |
| `/auth/register` | Create an organization (name, email, password) |
| `/auth/forgot-password`, `/auth/reset-password` | Password reset flow (no backend endpoint exists yet) |
| `/auth/verify-email` | Email verification (simulated — no backend endpoint yet) |
| `/auth/accept-invite` | Join an org from an invite (staked out for the `organization_members.status = 'invited'` flow — not built on the backend yet) |

### Dashboard (`/dashboard/*`) — the authenticated merchant app

Shell: `components/dashboard/DashboardShell.tsx` (sidebar on desktop, slide-down
nav on mobile). Nav config: `lib/navigation.ts`. No route protection exists yet
— add it in `app/dashboard/layout.tsx` once a session strategy is chosen.

| Route | Purpose |
|---|---|
| `/dashboard` | Overview — KPIs + open revenue opportunities |
| `/dashboard/products`, `/products/new`, `/products/[id]` | Catalog management |
| `/dashboard/customers` | Customer list (empty state — no mock data yet) |
| `/dashboard/payments` | Payment history breakdown |
| `/dashboard/revenue` | Revenue opportunities — detect / approve / reject / execute (all UI shells) |
| `/dashboard/analytics` | Revenue trend, top products, order-status breakdown |
| `/dashboard/agent` | Commerce Agent console (test conversational buyer flows) |
| `/dashboard/copilot` | AI Copilot chat (merchant-facing, read-only) |
| `/dashboard/audit` | Audit log timeline |
| `/dashboard/settings` | Organization details, team members, API access (all placeholders) |

### System

`not-found.tsx`, `error.tsx`, `loading.tsx`, `global-error.tsx` at the app
root. Reusable states in `components/states/`: `EmptyState`, `ErrorState`
(generic/network/unauthorized/forbidden), `LoadingState`/`PageLoader`/
skeletons, `SuccessState`, `MaintenanceState`, `OfflineState`.

## What's intentionally not implemented

Per the current build phase, none of the following are wired up — every
related page is a validated UI shell over mock or empty data:
real authentication/sessions, Razorpay checkout, AI provider calls (commerce
agent chat, AI copilot), revenue-opportunity detection/execution, product/
customer CRUD, billing, and email delivery. Mock data lives in `lib/mock/`
and is clearly commented as demo-only.

## Current status

The landing-page **Navbar + Hero + full section set** is built
(`src/components/landing/`). The full site route architecture — public
marketing, auth, and the authenticated merchant dashboard — is scaffolded
per the route map above. Feature-by-feature backend wiring is the next phase.
