# NearFix 🚧 — Punjab Civic Pothole Reporting & Tracking Platform

**NearFix** is a mobile-first civic-tech web app designed for citizens and municipal authorities in **Ludhiana**, **Amritsar**, and across Punjab to report, inspect, prioritize, and repair potholes with end-to-end transparency.

---

## Complete Reporting-to-Resolution Workflow

```
1. Citizen reports pothole (Photo + GPS/Map pin + Severity + Description)
   ↓
2. Unique ID generated (e.g. NF-2610-LDH01) & initial status: 'submitted'
   ↓
3. Rule-based priority scoring automatically calculates Risk Tier (High / Medium / Low)
   ↓
4. Municipal Authority logs into /authority console & inspects report
   ↓
5. Authority Verifies (or Rejects with formal reason)
   ↓
6. Authority sets traffic level & sensitive location (School, Hospital, Market)
   ↓
7. Authority dispatches crew: 'assigned' → 'in_progress'
   ↓
8. Authority marks 'repaired' with photographic proof & closure note
   ↓
9. Citizen tracking page (/track/:id) & city map reflect live progress & proof
```

---

## Features

| Area | Features |
|---|---|
| 🏠 **Home** | Open & Repaired counts, Ludhiana/Amritsar city map preview, recent reports |
| 📸 **Report** | Photo capture/upload, GPS location, Ludhiana & Amritsar quick pins, 3-tier severity selector, 280-char description |
| 🗺️ **Map** | Leaflet map with colored status pins (Submitted, Verified, Assigned, In Progress, Repaired, Rejected), city toggles for Ludhiana & Amritsar, popup with photo and direct tracking link |
| 🔍 **Track** | Search by code (`NF-YYMM-XXXXX`), 5-step status stepper, before/after photos, rejection banner, timestamped history log, auto-refresh on tab focus |
| 🛡️ **Authority Console** | Protected `/authority` dashboard with metric cards, server-side filters, rule-based priority score inspector, manual priority override modal, status transition buttons, repair photo uploader |

---

## Tech Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (navy/white/blue/teal design system)
- **Supabase** (PostgreSQL, Row Level Security, Storage Buckets, Auth)
- **React Router v6** (with protected Authority route guard)
- **Leaflet + React-Leaflet** (custom SVG divIcon markers with OpenStreetMap)
- **Lucide React** icons

---

## Database Setup & Migrations

### 1. Run Initial Schema
In your Supabase project's **SQL Editor**, run [`supabase/schema.sql`](./supabase/schema.sql) if setting up a fresh database.

### 2. Run Authority Migration
Run [`supabase/migrations/002_authority.sql`](./supabase/migrations/002_authority.sql) in the **SQL Editor**.

This migration:
- Updates the status check constraint to: `submitted`, `verified`, `assigned`, `in_progress`, `repaired`, `rejected`.
- Migrates any legacy rows (`under_review` → `verified`, `resolved` → `repaired`).
- Adds assessment columns: `reported_severity`, `traffic_level`, `near_sensitive_location`, `priority_score`, `priority_reasons`, `priority_overridden`, `override_reason`, `repair_photo_url`, `closure_note`, `rejection_reason`.
- Creates the `profiles` table linked to `auth.users` with role checks.
- Creates the `report_history` table and an automated trigger that records every status change and priority update into an immutable audit trail.
- Enforces valid status transitions inside the database (`submitted` → `verified` | `rejected`, `verified` → `assigned` → `in_progress` → `repaired`, `rejected` → `submitted`).
- Sets up Row Level Security (RLS) restricting updates to authorities while keeping citizen reads and submissions public.
- Creates the `repair-photos` public storage bucket.

### 3. Run City Migration
Run [`supabase/migrations/003_city.sql`](./supabase/migrations/003_city.sql) after `002_authority.sql`.

This migration:
- Adds a nullable `city` column (`Ludhiana` / `Amritsar`).
- Backfills existing reports using the city coordinate boxes.
- Adds an indexed city filter for map and authority queries.

---

## Creating the First Authority Account

Authority accounts are **not** created via public sign-up. They are provisioned through Supabase Auth and assigned the `authority` role:

### Step 1: Create user in Supabase Auth
1. Go to your Supabase Project Dashboard → **Authentication** → **Users**.
2. Click **Add User** → **Create User**.
3. Enter the officer's email (e.g. `officer@ludhiana.gov.in`) and a secure password.
4. Click **Create User**.

### Step 2: Grant Authority Role in SQL Editor
Run the following SQL snippet in the **SQL Editor**:

```sql
-- Grant authority role to the user
UPDATE public.profiles
SET
  role = 'authority',
  full_name = 'Er. Gurpreet Singh (Municipal Corporation)'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'officer@ludhiana.gov.in'
);

-- Verify the role assignment
SELECT id, full_name, role, created_at
FROM public.profiles
WHERE role IN ('authority', 'admin');
```

The user can now sign in at **`/authority/login`**.

---

## Demo Mode

If environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured (or remain set to placeholder values), NearFix automatically operates in **Demo Mode**:

- 12 realistic sample reports across **Ludhiana** (Ferozepur Rd, Model Town, Gill Rd, Clock Tower) and **Amritsar** (Mall Rd, GT Rd Railway Station, Majitha Rd, Ranjit Avenue) are loaded.
- All report modifications, status advances, and audit logs persist in browser `localStorage`.
- **Demo Authority Login**:
  1. Open [http://localhost:5173/authority/login](http://localhost:5173/authority/login).
  2. Click the **"⚡ Quick Demo Login (Municipal Officer)"** button (or enter any email & password).
  3. You are granted instant access to the `/authority` dashboard and can verify, assign, update, and repair potholes.

---

## Transparent Rule-Based Priority

Located in [`src/lib/priority.js`](./src/lib/priority.js), the rule-based calculation is purely transparent with no AI claims:

$$\text{Score} = \text{Severity Points} + \text{Sensitive Location Bonus} + \text{Traffic Points} + \text{Age Bonus}$$

- **Reported Severity**: Low (+1), Medium (+2), High (+3)
- **Near Sensitive Location** (School, Hospital, Bus Stand, Market): +2
- **Traffic Level**: Low (+0), Medium (+1), High (+2)
- **Age of Open Report**: >7 days (+1), >14 days (+2)
- **Tier Classification**: $\ge 6$ High, $3 - 5$ Medium, $< 3$ Low

Authorities can view the exact human-readable reasons breakdown on the dashboard and detail pages, and can manually override the priority by providing an official written justification.

---

## Punjab Cities Map Support

NearFix includes dedicated presets and markers for:
- **Ludhiana** (`30.9010° N, 75.8573° E`) — Clock Tower, Ferozepur Road, Model Town, BRS Nagar, Gill Road.
- **Amritsar** (`31.6340° N, 74.8723° E`) — Mall Road, Company Bagh, GT Road Railway Station, Majitha Road.

Citizens can use quick-pin buttons on the report page to place markers directly in their city, or filter the live map to view either Ludhiana, Amritsar, or all Punjab reports.

NearFix only accepts reports inside the Ludhiana or Amritsar service areas; arbitrary Punjab coordinates are rejected with `NearFix currently covers Ludhiana and Amritsar only.` For development/testing, set `VITE_ALLOW_ANY_LOCATION=true` in `.env` to bypass this check.

### Geolocation Note
The browser geolocation API only works in a **secure context**. Use `http://localhost:5173` during development or serve the built app over HTTPS. Opening the app from a plain HTTP LAN address (for example `http://192.168.x.x:5173`) will block the "Use my current location" permission request.

---

## Project Structure

```
nearfix/
├── src/
│   ├── components/
│   │   ├── authority/     AuthorityLayout, AuthorityGuard
│   │   ├── layout/        AppLayout, BottomNav, Sidebar
│   │   ├── map/           ReportMap (Leaflet), LocationPicker
│   │   ├── reports/       ReportCard, PhotoUploader
│   │   └── ui/            Button, Card, StatusBadge, PriorityBadge, Spinner, EmptyState
│   ├── hooks/             useAuth, useGeolocation, useReports
│   ├── lib/               constants.js, priority.js, supabase.js, utils.js
│   ├── pages/
│   │   ├── authority/     LoginPage, DashboardPage, ReportDetailPage
│   │   ├── HomePage.jsx
│   │   ├── MapPage.jsx
│   │   ├── ReportPage.jsx
│   │   └── TrackPage.jsx
│   ├── services/
│   │   ├── demoData.js    (Local demo adapter with Ludhiana & Amritsar data)
│   │   └── reports.js     (Unified facade over Supabase & Demo)
│   └── App.jsx
├── supabase/
│   ├── schema.sql
│   └── migrations/
│       ├── 002_authority.sql
│       └── 003_city.sql
└── package.json
```

---

## Build & Preview

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```
