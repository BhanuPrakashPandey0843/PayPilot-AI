# PayPilot AI

PayPilot AI is a submission for **Track 01: AI Growth & Agentic Commerce** — building an agent that grows a merchant's revenue on Razorpay test-mode APIs, or makes a merchant transactable end-to-end by an AI buyer. See [`documentaion/Problem_Statement.md`](./documentaion/Problem_Statement.md) for the full brief.

Design reference: [WayPilot — AI-powered FinTech SaaS Website UX/UI (Behance)](https://www.behance.net/gallery/254017335/WayPilot-AI-powered-FinTech-SaaS-Website-UXUI-Design)

## Project structure

```
PayPilot AI/
├── backend/         Fastify + TypeScript API (Postgres via Drizzle ORM, Redis, Razorpay, JWT auth)
├── frontend/         Next.js + TypeScript web app (Tailwind CSS v4, shadcn/ui, Radix)
├── documentaion/     Problem statement and tech stack notes
└── ppt/              Presentation / pitch deck assets
```

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your own values
npm run dev             # once a dev script is added — see backend/Readme.md
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Status

This repository currently holds the initial scaffolding for both apps (dependencies chosen, project structure in place). Application code — API routes, database schema, and the frontend UI — is still to be built. See each package's own README for details and current gaps.

## Tech stack

See [`documentaion/Tech_stack.md`](./documentaion/Tech_stack.md).
