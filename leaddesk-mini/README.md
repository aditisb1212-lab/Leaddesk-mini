# LeadDesk Mini

A small lead-capture product built for the Digital Heroes Full Stack
Development qualification task (Task A + Task B): a public landing page
that collects leads, and a protected `/admin` dashboard to search, filter,
and manage them.

## Live URLs

- Landing page: `<add your deployed frontend URL here>`
- Admin: `<same URL>/admin`
- Test admin login: set via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` when
  you run the seed script (see Setup below) - include the credentials you
  actually used in your submission.

## Loom walkthrough checklist

Task B scores the walkthrough on covering the flow end-to-end, so a quick
run-through in this order hits everything:

1. Submit a lead on the public landing page - show a validation error
   first (e.g. bad email), then a successful submission.
2. Log in at `/admin/login` with the seeded credentials.
3. Show the new lead in the table, then use search and the status filter
   chips to narrow it down.
4. Click a status pill to advance New → Contacted → Closed.
5. Briefly mention the auth approach (JWT in an httpOnly cookie, bcrypt
   hash, no hardcoded password) and where the SQLite schema lives
   (`backend/db/schema.sql`).
6. Log out and try loading `/admin` directly - show it redirects to login
   rather than exposing the dashboard.

## Stack

- **Frontend:** React (Vite), React Router
- **Backend:** Node.js + Express
- **Database:** SQLite (via `sqlite3` + the `sqlite` Promise wrapper) - a
  single file, zero external services to provision, and an async API that
  fits naturally into Express's `async`/`await` request handlers
- **Auth:** JWT stored in an httpOnly cookie (never localStorage, so it
  isn't reachable by injected JS)

## Data model

**`leads` table**

| column | type | notes |
|---|---|---|
| id | INTEGER PK | autoincrement |
| name | TEXT | 2-120 chars, required |
| email | TEXT | validated format, required |
| budget_range | TEXT | `CHECK` constraint: `under_1k` \| `1k_5k` \| `5k_15k` \| `15k_50k` \| `50k_plus` |
| message | TEXT | 10-2000 chars, required |
| status | TEXT | `CHECK` constraint: `New` \| `Contacted` \| `Closed`, defaults to `New` |
| ip | TEXT | request IP at submission time, admin-only, never returned to the public endpoint |
| created_at / updated_at | TEXT (ISO 8601) | set in application code |

Indexes: `(status, created_at DESC)` for the filtered/sorted admin list, and
single-column indexes on `name` and `email` for the search box's `LIKE`
queries. SQLite's `CHECK` constraints do double duty as a second line of
defense under the API's own validation - a malformed status or budget range
is rejected at the database layer even if a bug slipped past
`express-validator`.

**`admins` table**

| column | type | notes |
|---|---|---|
| id | INTEGER PK | autoincrement |
| email | TEXT UNIQUE | |
| password_hash | TEXT | bcrypt, 12 rounds |
| created_at | TEXT | |

No admin password is ever hardcoded in source. The only way an admin
account gets created is via `npm run seed:admin`, which reads
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` and hashes the
password before it touches the database.

## Auth approach

- On login, the server verifies the email/password against the bcrypt hash
  and issues a JWT (`jsonwebtoken`) signed with `JWT_SECRET`, containing
  the admin's id and email.
- The token is set as an **httpOnly, `sameSite` cookie** (`secure` in
  production) rather than returned in the response body - this means it
  can't be read or exfiltrated by client-side JavaScript, which is the
  main risk with storing tokens in localStorage.
- Every `/api/leads` route except the public `POST /` and every
  `/api/auth` route except `/login` runs through a `requireAuth`
  middleware that verifies the JWT from the cookie before the request
  reaches the controller.
- Both the login endpoint and the public lead-submission endpoint are
  rate-limited (`express-rate-limit`) to blunt brute-force and spam
  attempts.
- Logout clears the cookie server-side; there's no token to "invalidate"
  beyond that since sessions are short-lived (8h) and stateless.

## Deploying (Task B)

The frontend and backend deploy to two different domains, so the pieces
that make that work are: `VITE_API_BASE_URL` (frontend knows where the API
lives), `CLIENT_ORIGIN` (backend's CORS allow-list), and `NODE_ENV=production`
(switches the auth cookie to `Secure; SameSite=None`, which is required for
a cookie to survive a cross-site request at all).

### Backend → Render (free tier)

1. Push this repo to GitHub, then in Render: **New → Web Service**, connect
   the repo, set **Root Directory** to `backend`.
2. Build command: `npm install`. Start command: `npm start`.
3. Add a **persistent disk** (Render's free tier includes one) mounted at
   e.g. `/data`, and set `DB_FILE=/data/leaddesk.sqlite3` as an env var -
   without this the SQLite file is wiped on every redeploy.
4. Add the remaining env vars from `.env.example`: `JWT_SECRET` (generate
   with `openssl rand -hex 32`), `NODE_ENV=production`,
   `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`. Leave `CLIENT_ORIGIN` for
   step 6.
5. Deploy. Then open Render's **Shell** tab for this service and run
   `npm run seed:admin` once to create the admin account against the
   persistent disk.
6. Once you also have the Vercel URL (step below), come back and set
   `CLIENT_ORIGIN=https://your-app.vercel.app`, then redeploy.

### Frontend → Vercel (free tier)

1. **New Project** → import the same repo → set **Root Directory** to
   `frontend`. Vercel auto-detects the Vite framework preset.
2. Add an env var: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
   (the exact URL Render gave your backend, with `/api` appended).
3. Deploy. `vercel.json` is already set up to rewrite all routes to
   `index.html`, so refreshing `/admin` or `/admin/login` directly won't
   404 - this matters because it's a client-side-routed single-page app.

### Verifying it actually works (the "fresh browser, no local state" check)

Open the deployed frontend URL in a **private/incognito window** (no
cached cookies, no dev-server proxy to fall back on) and confirm:

- The landing page loads and a lead submission succeeds.
- `/admin/login` accepts the seeded admin credentials and redirects to
  `/admin`.
- The lead you just submitted shows up, search/filter work, and clicking
  a status pill advances it.
- Refreshing the browser on `/admin` keeps you logged in (cookie
  persists) but opening `/admin` in a *new* incognito window does not
  (no session to reuse) - confirming the cookie is scoped correctly
  rather than the app trusting anyone who hits the URL.

## Setup (local development)

### Backend

```bash
cd backend
npm install
cp .env.example .env        # then edit JWT_SECRET, SEED_ADMIN_EMAIL/PASSWORD
npm run seed:admin           # creates the admin account from .env
npm run dev                  # starts on http://localhost:5000
```

The SQLite file (`leaddesk.sqlite3`) and its schema are created
automatically on first run - no separate database provisioning step.

### Frontend

```bash
cd frontend
npm install
npm run dev                  # starts on http://localhost:5173, proxies /api to :5000
```

No `frontend/.env` needed locally - `VITE_API_BASE_URL` is only set for
the production build (see Deploying, above).

### Production build (local check before deploying)

```bash
cd frontend
npm run build                # outputs to frontend/dist
```

## Project structure

```
backend/
  config/db.js          - opens the SQLite file, runs schema.sql on boot
  db/schema.sql          - table definitions, indexes, CHECK constraints
  models/                - Lead.js, Admin.js: all SQL lives here
  controllers/            - request handling, thin wrappers over models
  routes/                 - Express routers + express-validator rules
  middleware/auth.js      - JWT verification for protected routes
  utils/seedAdmin.js      - one-off admin account creation/rotation
  server.js               - app wiring, CORS, error handling

frontend/
  src/pages/              - LandingPage, AdminLogin, AdminDashboard
  src/components/         - LeadForm, LeadsTable, Footer, ProtectedRoute
  src/api.js              - fetch wrapper (credentials: "include" for the cookie)
```

## Design decisions worth calling out

1. **SQLite over a hosted database.** For a task of this size, a single
   file with zero network round-trips and no account/cluster to
   provision is a better fit than Postgres/Mongo. The `sqlite3` driver
   (via the `sqlite` wrapper) keeps every DB call as a normal
   `async`/`await` Promise, consistent with the rest of the Express app -
   and `express-async-errors` makes sure a rejected promise in any route
   handler reaches the centralized error handler instead of crashing the
   process.
2. **Regex `LIKE` search over a full-text index.** SQLite's FTS5 is
   overkill for matching against two short columns (name, email); a
   plain indexed `LIKE '%term%'` is simpler and fast enough at this
   scale.
3. **httpOnly cookie over a bearer token in the response body.** Slightly
   more setup (CORS `credentials`, cookie flags) in exchange for the
   token never being reachable by client-side JS - the right trade-off
   for anything with a real login.

## AI tool usage

AI assistance was primarily used for:

- Brainstorming the project architecture and folder structure.
- Understanding Express.js and JWT authentication concepts.
- Generating initial code snippets for repetitive CRUD operations.
- Debugging runtime errors and deployment issues.
- Improving code readability and documentation.
- Refining the README and project documentation.

All application logic, project integration, testing, debugging, deployment, and final implementation decisions were completed manually. Every AI-generated suggestion was reviewed, modified where necessary, and validated before being included in the final project.

## What I'd change with another day

- Add pagination controls to the admin UI (the API already supports
  `page`/`limit`; the frontend currently just requests up to 100 rows).
- Move the SQLite file to a mounted volume path via `DB_FILE` in
  production and add a basic backup/export script.
- Add automated tests (currently verified manually end-to-end: lead
  submission, validation failures, login/logout, session expiry, and
  status transitions all confirmed against a running instance).
