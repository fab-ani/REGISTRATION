# CampusID — Next.js + SQLite registration

Single-page Next.js app for student registration, backed by SQLite. The
same `/api/login` endpoint is what the Flutter app will hit to sign
students in (reg-number-only auth — if you're not in the database, the
app login fails).

## Stack

- **Next.js 14** (App Router, JavaScript, no TypeScript)
- **better-sqlite3** — synchronous SQLite, file lives at `data/campusid.db`
- No build step needed — just `npm install && npm run dev`

## Project layout

```
REGISTRATION/
├── app/
│   ├── layout.js              # root layout + font preconnects
│   ├── page.js                # the registration form (Client Component)
│   ├── globals.css            # Soft-UI palette (sage green / off-white)
│   └── api/
│       ├── register/route.js  # POST  — create a student
│       ├── login/route.js     # POST  — fetch a student by reg number
│       └── students/route.js  # GET   — list everyone (debug helper)
├── lib/
│   ├── db.js                  # SQLite open + queries
│   └── cors.js                # CORS headers for the Flutter app
├── data/                      # SQLite file lives here (git-ignored)
├── package.json
├── next.config.js
└── jsconfig.json
```

## Schema

One table, four fields the user asked for + bookkeeping:

```sql
CREATE TABLE students (
  reg_number    TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  course        TEXT NOT NULL,
  year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 6),
  role          TEXT NOT NULL CHECK (role IN ('student','cr')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

The reg number `23062313037` is hardcoded as the **Class Representative** —
`createStudent()` in [lib/db.js](lib/db.js) auto-tags that row with
`role = 'cr'`. The Flutter app will read that field on sign-in to show
the "Create QR session" screen.

## Run it

Once, to install dependencies (better-sqlite3 needs Node build tools — see
"Windows note" below):

```powershell
cd D:\Work\REGISTRATION
npm install
```

Dev mode (hot reload, http://localhost:3000):

```powershell
npm run dev
```

Production build:

```powershell
npm run build
npm start
```

The SQLite file is created on first request at `data/campusid.db`. Delete
that file to reset the database.

### Windows note

`better-sqlite3` ships prebuilt binaries for Node 18/20/22 on Windows
x64, so `npm install` should "just work." If it tries to compile from
source and fails, install the [windows-build-tools](
https://github.com/felixrieseberg/windows-build-tools) once (`npm i -g
windows-build-tools` from an Admin PowerShell), or upgrade to a Node
version that has a prebuilt binary.

## API

All routes accept and return JSON. CORS is wide open (`*`) for dev.

### POST `/api/register`

```jsonc
// request
{ "name": "Alex Rivers", "regNumber": "23062313037",
  "course": "Computer Science", "yearOfStudy": 3 }

// 201
{ "student": { "regNumber": "23062313037", "name": "...",
               "course": "...", "yearOfStudy": 3, "role": "cr",
               "createdAt": "2025-06-14 12:34:56" } }

// 400 — bad input          (name/course missing, reg # malformed, year out of range)
// 409 — already registered (reg number is the primary key)
```

### POST `/api/login`

```jsonc
// request
{ "regNumber": "23062313037" }

// 200 — registered
{ "student": { ... same shape as above ... } }

// 404 — not registered
{ "error": "Not registered. Sign up on the website first." }
```

### GET `/api/students`

Returns `{ students: [...] }`. Useful for sanity-checking the DB without
opening the file.

## Pointing the Flutter app at this server

On the same machine the phone won't reach `localhost:3000`. Two options:

1. **LAN access (easy):** start the server with `npm run dev` and find
   your PC's LAN IP (e.g. `192.168.1.42`). On the phone (same Wi-Fi),
   the API base URL is `http://192.168.1.42:3000`.
2. **Public tunnel:** `npx localtunnel --port 3000` or `ngrok http 3000`
   for a public HTTPS URL.

The Flutter changes (next iteration) will read this URL from a single
constant so you only set it once.

## What's coming next (Flutter side)

When this is verified working (you can register on the site + see your
row via `GET /api/students`), the app changes will be:

1. **Login screen** — reg number only, POSTs to `/api/login`. Persists
   the returned `student` in `SharedPreferences`.
2. **CR detection** — if `student.role == 'cr'`, an extra "Create
   Attendance Session" screen unlocks.
3. **Create QR (CR)** — form with subject + teacher + time → POST to
   `/api/sessions` → renders a QR encoding the returned session ID via
   `qr_flutter`.
4. **Scan QR (students)** — `mobile_scanner` → POST to
   `/api/sessions/{id}/attend` with the student's reg number.
5. **Attendance tab** — already exists; will read real attendance from
   `/api/students/{reg}/attendance`.
