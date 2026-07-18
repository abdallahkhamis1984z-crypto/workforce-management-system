# Workforce Management System — ERP-Style Manufacturing Solution

A complete, bilingual (Arabic/English) Workforce Management System for food manufacturing
plants with 500+ workers. Built with **React 18 + TypeScript + Tailwind CSS + Supabase**.

---

## 1. Folder Structure

```
workforce-management-system/
├── README.md                     ← this file
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── .env.example
├── index.html
├── docs/
│   └── ERD.md                    ← entity relationship diagram (Mermaid)
├── supabase/
│   └── schema.sql                ← full DB schema + RLS policies
└── src/
    ├── main.tsx                  ← entry point
    ├── App.tsx                   ← router + route guards
    ├── index.css                 ← Tailwind base
    ├── i18n/
    │   ├── ar.json                ← Arabic dictionary
    │   └── en.json                ← English dictionary
    ├── context/
    │   ├── AuthContext.tsx        ← auth state + role/permission matrix
    │   └── LangContext.tsx        ← language + RTL/LTR switching
    ├── lib/
    │   ├── supabaseClient.ts      ← Supabase client init
    │   └── calculations.ts        ← ALL automatic calculation logic (see §3)
    ├── types/
    │   └── index.ts               ← TypeScript types mirroring the DB schema
    ├── components/
    │   ├── layout/                ← Sidebar, Topbar, AppLayout
    │   ├── ui/                    ← StatCard, Badge, DataTable
    │   └── ProtectedRoute.tsx     ← role-based route guard
    └── pages/
        ├── Login.tsx
        ├── employees/             ← Employee Management (CRUD)
        ├── attendance/             ← Daily Attendance Management
        ├── evaluation/             ← Worker + Supervisor evaluation
        ├── dashboards/             ← Production / HR / Management dashboards
        ├── reports/                ← Excel & PDF report export
        └── notifications/          ← Alert center
```

---

## 2. Database & ERD

See `supabase/schema.sql` for the full DDL (tables, enums, indexes, RLS policies,
helper view) and `docs/ERD.md` for the entity-relationship diagram (Mermaid — renders
directly on GitHub or in any Mermaid-compatible viewer).

**Core tables:** `departments`, `sections`, `profiles` (system users), `employees`
(factory workers), `attendance_records`, `worker_evaluations`, `supervisor_evaluations`,
`leave_balances`, `notifications`, `audit_log`.

---

## 3. Automatic Calculations (`src/lib/calculations.ts`)

| Function | Purpose |
|---|---|
| `summarizeAttendance()` | Attendance %, Absenteeism %, total leaves/permissions/OT hours, late frequency |
| `calcWorkerEvaluation()` | Weighted worker score: Attendance 25% · Productivity 25% · Quality 20% · Discipline 15% · Teamwork 5% · Safety 10% → total /100 |
| `evalLevel()` | Maps score → Excellent (95-100) / Very Good (85-94) / Good (75-84) / Acceptable (60-74) / Poor (<60) |
| `calcSupervisorScore()` | Composite supervisor KPI (attendance discipline, production target, OEE, absenteeism, training, safety, turnover, quality, material losses, reporting) |
| `rankByAverageScore()` | Generic yearly ranking for workers **and** supervisors — averages monthly totals and sorts descending |
| `evaluateNotificationRules()` | Rule engine for excessive absenteeism / frequent permissions / poor performance alerts |

All functions are **pure** (no side effects) and unit-testable in isolation.
Adjust weight constants (`EVAL_WEIGHTS`, `SUPERVISOR_KPI_WEIGHTS`, `NOTIFICATION_THRESHOLDS`)
to match factory policy without touching UI code.

---

## 4. Roles & Permissions

| Role | Employees | Attendance | Evaluation | Dashboards | Reports | User Mgmt |
|---|---|---|---|---|---|---|
| **admin** | Full CRUD | Full | Full | All 3 | All | Full |
| **hr_manager** | Full CRUD | Full | Full | All 3 | All | — |
| **production_manager** | Read | Enter/Edit | Enter worker eval | Production + Mgmt | All | — |
| **supervisor** | Read own team | Enter own team | — | Production (own team) | Own team | — |
| **viewer** | — | — | — | Read-only | Read-only | — |

Enforced in two layers:
1. **Database (RLS)** — `supabase/schema.sql` policies (source of truth, cannot be bypassed from the client).
2. **UI (`ProtectedRoute` + `PERMISSIONS` matrix in `AuthContext.tsx`)** — hides/blocks routes for UX, not security.

---

## 5. Local Development

```bash
npm install
cp .env.example .env        # fill in your Supabase URL + anon key
npm run dev                 # http://localhost:5173
```

## 6. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
3. **Authentication → Providers**: enable Email/Password (or SSO as needed).
4. Create your first admin user via **Authentication → Users → Add User**, then insert
   a matching row in `profiles` with `role = 'admin'`.
5. Copy **Project Settings → API → Project URL** and **anon public key** into `.env`.
6. (Optional, recommended) Create the two RPC/view helpers referenced by the dashboards
   (`department_attendance_today`, `absenteeism_trend_12m`, `department_performance_ranking`)
   as Postgres functions — the dashboard pages call them via `supabase.rpc(...)` and are
   ready to receive real aggregated data once these are defined.

## 7. Deployment

**Frontend (Vercel — recommended):**
```bash
npm run build          # outputs to /dist
```
- Push the repo to GitHub → import into [vercel.com](https://vercel.com) → set the two
  `VITE_SUPABASE_*` environment variables in Project Settings → Deploy.
- Alternative: Netlify / Cloudflare Pages — same build command (`npm run build`),
  publish directory `dist`.

**Backend:** Supabase is fully managed — no separate backend deployment needed.
For 500+ concurrent workers/supervisors, the free tier is sufficient for daily
attendance entry; upgrade to the Pro tier for production use (better performance,
daily backups, no project pausing).

**Mobile access:** the app is fully responsive (Tailwind breakpoints) — supervisors
can enter attendance directly from a phone browser on the shop floor with no separate
app install. For an installable experience, wrap with a PWA manifest (not included by
default — ask if you'd like this added).

---

## 8. Extending the System

- **New attendance status**: add to the `attendance_status` enum in `schema.sql` +
  `AttendanceStatus` type + `ar.json`/`en.json` labels.
- **Change evaluation weights**: edit `EVAL_WEIGHTS` / `SUPERVISOR_KPI_WEIGHTS` in
  `calculations.ts` — every page recalculates automatically, no other changes needed.
- **New report type**: extend `dateRangeFor()` in `Reports.tsx`.
- **New role**: add to `user_role` enum + update `PERMISSIONS` matrix + RLS policies.

---

## 9. What's Included vs. What to Finish Before Production

**Included (working code):** full schema + RLS, TypeScript types, all calculation
logic, auth + role guarding, i18n (AR/EN + RTL/LTR), employee CRUD, daily attendance
entry (mobile + desktop layouts), worker + supervisor evaluation forms with live
scoring, 3 dashboards wired to Supabase, Excel/PDF report export, notifications UI.

**To finish before go-live:**
- Create the Postgres RPC functions/views referenced by the dashboards (aggregation
  queries — the shapes are documented inline in each dashboard file).
- Add a scheduled Supabase Edge Function (or `pg_cron` job) to run
  `evaluateNotificationRules()` nightly against fresh attendance data and insert rows
  into `notifications`.
- Extend RLS policies to `worker_evaluations` / `supervisor_evaluations` /
  `leave_balances` following the same pattern already applied to `employees` /
  `attendance_records`.
- Add automated tests for `calculations.ts` (pure functions — trivial to test).
- Load-test attendance bulk-upsert for 500+ rows/day (Supabase handles this comfortably,
  but confirm with your specific plan's connection limits).
