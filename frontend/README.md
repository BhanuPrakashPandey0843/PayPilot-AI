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

## Current status

The landing-page **Navbar + Hero** section is built (`src/components/landing/`), matching the provided desktop/mobile design references. GSAP drives the entrance sequence, Motion handles hover/tap micro-interactions, and `prefers-reduced-motion` is respected. The rest of the landing page (features, pricing, footer, etc.) has not been built yet.
