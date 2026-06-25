# Dairy Farm Management System

Monorepo with **separate frontend and backend** services that can be deployed independently.

```
├── backend/    Express.js REST API + Prisma ORM  →  runs on :4000
└── frontend/   Next.js 14 UI (App Router)        →  runs on :3000
```

---

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
npx prisma generate
npx prisma db push
node prisma/seed.js           # creates admin@dairy.com / admin123
npm run dev                   # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
# NEXT_PUBLIC_API_URL defaults to http://localhost:4000, no .env needed in dev
npm run dev                   # starts on http://localhost:3000
```

Open **http://localhost:3000** — login with `admin@dairy.com` / `admin123`

---

## How it works (dev)

`frontend/next.config.js` rewrites all `/api/*` requests → backend:

```
Browser → localhost:3000/api/... → (Next.js rewrite) → localhost:4000/api/...
```

This keeps cookies same-origin so there are no CORS or SameSite issues in development.

---

## Environment Variables

### `backend/.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dairy_farm"
JWT_SECRET="change-me-in-production"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

### `frontend/.env.local` (optional in dev)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Production Deployment

- Deploy `backend/` to any Node.js host (Railway, Render, EC2)
- Deploy `frontend/` to Vercel or any Next.js-compatible host
- Set `NEXT_PUBLIC_API_URL` in frontend to the backend's public URL
- Recommended: put both behind a reverse proxy (nginx / Cloudflare) so `/api/*` routes to backend — keeps cookies same-origin

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Express.js + Prisma 5 + PostgreSQL |
| Frontend | Next.js 14 (App Router, client components) |
| Auth | JWT in HTTP-only cookies, bcryptjs |
| UI | Radix UI + Tailwind CSS (dark mode) |
| State | TanStack Query v5 + Axios |
| Forms | React Hook Form |
| Calendar | Bikram Sambat (BS) ↔ Gregorian (self-contained) |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          DB schema (Branch, Milkman, MilkCollection, Payment, PricingConfig)
│   └── seed.js                Seeds admin user + pricing config
├── src/
│   ├── index.js               Express app entry point
│   ├── middleware/
│   │   └── auth.js            JWT sign/verify, requireAuth, requireAdmin
│   ├── lib/
│   │   └── prisma.js          Prisma client singleton
│   └── routes/
│       ├── auth.js            POST /login, POST /logout, GET /me
│       ├── branches.js        CRUD /api/branches
│       ├── milkmen.js         CRUD /api/milkmen + /api/milkmen/:id
│       ├── collections.js     /api/collections
│       ├── payments.js        /api/payments
│       ├── pricingConfig.js   /api/pricing-config
│       ├── users.js           /api/users
│       ├── dashboard.js       /api/dashboard
│       └── reports.js         /api/reports/daily|branch|milkman/:id

frontend/
├── src/
│   ├── app/                   Next.js pages (no API routes)
│   │   ├── dashboard/
│   │   ├── milkmen/[id]/
│   │   ├── collections/
│   │   ├── payments/
│   │   ├── branches/
│   │   ├── reports/
│   │   ├── pricing-config/
│   │   ├── users/
│   │   └── login/
│   ├── components/
│   │   ├── layout/            AppShell, Sidebar (with dark mode toggle)
│   │   └── ui/                NepaliDatePicker + shadcn/ui primitives
│   ├── hooks/
│   │   └── useAuth.jsx        Auth context (login/logout/me)
│   └── lib/
│       ├── nepali-date.js     BS ↔ AD calendar (years 2070–2092)
│       └── utils.js           formatCurrency, formatDate (BS), formatLiters
├── next.config.js             /api/* rewrite → backend
└── tailwind.config.js
```
