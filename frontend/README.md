# PayPilot AI — Frontend

Next.js (App Router) web app for PayPilot AI, styled with Tailwind CSS v4 and shadcn/ui.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + Radix primitives
- [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for forms/validation
- [GSAP](https://gsap.com/) / [Motion](https://motion.dev/) for animation
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

This is still the default `create-next-app` scaffold (`src/app/page.tsx` / `layout.tsx`) with the design system (Tailwind theme, shadcn config) wired up. No PayPilot-specific pages or components have been built yet.
