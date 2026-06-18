# Dairy Farm Management System

A full-stack web application for managing milk collection, milkman payments, and reporting across multiple dairy farm branches. Built with Next.js 14 App Router, PostgreSQL, and Prisma ORM.

---

## Features

### Dashboard
- Real-time stats: total milk collected, revenue, payments made, and pending balance
- Filter by Today / This Week / This Month
- Milkman-wise payment ledger showing total litres, total earned, total paid out, and outstanding balance
- Pending Payment and Fully Settled counts with visual indicators
- Light and dark mode support

### Branch Management
- Create and manage multiple farm branches (name, code, address)
- Activate or deactivate branches
- Each milkman and collection is scoped to a branch

### Milkman Management
- Register milkmen with code, name, mobile, village, and branch assignment
- View individual milkman profile with full transaction history
- Per-milkman ledger: all collections and payments in chronological order

### Milk Collection
- Record daily milk intake per milkman (morning and evening shifts)
- Capture quantity (litres), FAT %, SNF %, and auto-calculated rate and amount
- Nepali date (Bikram Sambat) picker for date entry — dates stored as Gregorian internally
- Branch-scoped data entry for branch users

### Payments
- Record cash payments made to milkmen
- Reduces the outstanding balance in real time
- Payment history with date, amount, and optional remarks

### Pricing Configuration
- **Flat Rate mode** — fixed rate per litre (e.g. ₹60/L)
- **FAT + SNF mode** — rate calculated from fat and SNF coefficients
- Configuration history tracked with who set each rate and when

### Reports
- **Daily Report** — filter by BS date range; shows collections with milkman, quantity, rate, and amount; summary totals
- **Branch Report** — per-branch breakdown of total milk, total earned, total paid, and pending balance

### User Management (Admin only)
- Create users with ADMIN or USER role
- Assign branch users to specific branches
- Branch users see only their branch's data; admins see everything

### Authentication
- JWT-based auth stored in an HTTP-only cookie (7-day expiry)
- Login / logout flow
- Route-level protection via `requireAuth` and `requireAdmin` middleware helpers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | JavaScript (JSX) |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| UI Components | Radix UI primitives + shadcn/ui pattern |
| Styling | Tailwind CSS v3 (dark mode via `class` strategy) |
| State / Fetching | TanStack Query v5 + Axios |
| Forms | React Hook Form |
| Auth | JWT via `jose`, HTTP-only cookies, bcryptjs for passwords |
| Date Handling | Bikram Sambat ↔ Gregorian conversion (custom library + `bikram-sambat` package) |
| Notifications | Sonner (toast) |
| Icons | Lucide React |

---

## Data Models

```
Branch          — farm branch (name, code, address, status)
User            — system user with ADMIN or USER role, optionally scoped to a branch
Milkman         — milk supplier (code, name, mobile, village, branch)
MilkCollection  — daily collection record (milkman, date, shift, qty, fat, snf, rate, amount)
Payment         — payment to a milkman (amount, date, remarks)
PricingConfig   — active pricing rule (FLAT_RATE or FAT_SNF with coefficients)
```

Enums: `Role` (ADMIN, USER), `BranchStatus` (ACTIVE, INACTIVE), `Shift` (MORNING, EVENING), `PricingMode` (FLAT_RATE, FAT_SNF)

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           login, logout, me
│   │   ├── branches/       CRUD + [id]
│   │   ├── collections/    create + list
│   │   ├── dashboard/      aggregated stats + milkman ledger
│   │   ├── milk-rate/      current pricing config
│   │   ├── milkmen/        CRUD + [id] ledger
│   │   ├── payments/       create + list
│   │   ├── pricing-config/ update pricing mode
│   │   ├── reports/
│   │   │   ├── daily/      date-range collection report
│   │   │   ├── branch/     per-branch summary
│   │   │   └── milkman/    per-milkman report
│   │   └── users/          CRUD + [id]
│   ├── branches/           Branches page
│   ├── collections/        Collections entry page
│   ├── dashboard/          Main dashboard
│   ├── login/              Login page
│   ├── milk-rate/          Current rate display
│   ├── milkmen/
│   │   ├── page.jsx        Milkmen list
│   │   └── [id]/page.jsx   Individual milkman profile
│   ├── payments/           Payments page
│   ├── pricing-config/     Pricing configuration
│   ├── reports/            Reports (daily + branch tabs)
│   └── users/              User management (admin only)
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx    Main layout wrapper with sidebar
│   │   └── Sidebar.jsx     Navigation sidebar
│   ├── ui/
│   │   ├── NepaliDatePicker.jsx   BS date picker component
│   │   └── ...             shadcn/ui primitives (button, card, dialog, etc.)
│   ├── providers.jsx        QueryClient + ThemeProvider setup
│   └── theme-provider.jsx   next-themes wrapper
├── hooks/
│   └── useAuth.jsx          Auth context hook
└── lib/
    ├── auth.js              JWT sign/verify, cookie helpers, requireAuth/requireAdmin
    ├── nepali-date.js       Self-contained BS ↔ Gregorian converter (years 2070–2092)
    ├── prisma.js            Prisma client singleton
    └── utils.js             cn(), formatCurrency(), formatLiters(), formatDate()
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd dairy-farm-management-system

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dairy_farm"
JWT_SECRET="your-secure-secret-key"
```

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed the database with initial data
npm run db:seed
```

The seed script creates:
- Admin user: `admin@dairy.com` / `admin123`
- Branch user: `patna@dairy.com` / `user123`
- Two sample branches: Patna (PAT) and Gaya (GAY)
- Initial pricing config: Flat Rate ₹60/L

### Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The app runs at `http://localhost:3000`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

---

## API Routes

All routes require authentication unless noted.

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Login with email + password | Public |
| POST | `/api/auth/logout` | Clear session cookie | Any |
| GET | `/api/auth/me` | Get current user | Any |
| GET/POST | `/api/branches` | List / create branches | Admin |
| GET/PUT/DELETE | `/api/branches/[id]` | Get / update / delete branch | Admin |
| GET/POST | `/api/milkmen` | List / create milkmen | Any |
| GET/PUT/DELETE | `/api/milkmen/[id]` | Get milkman ledger / update / delete | Any |
| GET/POST | `/api/collections` | List / create collections | Any |
| GET/POST | `/api/payments` | List / create payments | Any |
| GET | `/api/dashboard` | Dashboard stats + ledger | Any |
| GET | `/api/milk-rate` | Current pricing config | Any |
| GET/POST | `/api/pricing-config` | Get / update pricing config | Admin |
| GET/POST | `/api/users` | List / create users | Admin |
| GET/PUT/DELETE | `/api/users/[id]` | Get / update / delete user | Admin |
| GET | `/api/reports/daily` | Daily collection report | Any |
| GET | `/api/reports/branch` | Branch summary report | Any |
| GET | `/api/reports/milkman/[id]` | Per-milkman report | Any |

---

## Roles and Permissions

| Feature | ADMIN | USER (branch-scoped) |
|---|---|---|
| View dashboard | All branches | Own branch only |
| Manage branches | Yes | No |
| Manage milkmen | All branches | Own branch only |
| Record collections | All branches | Own branch only |
| Record payments | All branches | Own branch only |
| View reports | All branches | Own branch only |
| Pricing config | Yes | View only |
| User management | Yes | No |

---

## Nepali Date Support

All date inputs throughout the app use the Bikram Sambat (BS) calendar via a custom date picker. Dates are converted to Gregorian and stored as standard `Date` fields in PostgreSQL. The conversion library supports BS years 2070–2092.

---

## Dark Mode

The app supports system-level and manually toggled dark mode using `next-themes` with Tailwind's `class` strategy. Toggle is available in the sidebar.
