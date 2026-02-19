# Coach Performance Dashboard

Role-based dashboard for coach performance evaluations. **Admin** sees org-wide analytics and user management; **Coach** sees only their developers.

## Setup

1. **Environment**  
   Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — SQLite path (e.g. `file:./prisma/dev.db`)
   - `AUTH_SECRET` — min 32 chars for NextAuth
   - `AUTH_URL` — e.g. `http://localhost:3000`

2. **Database**  
   ```bash
   npm run db:push
   npm run db:seed
   ```  
   Seeds default admin: **admin@lumenalta.com** / **changeme123**

3. **Data**  
   Evaluation data is read from `data/evaluations.json`. Replace or symlink your export there.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Sign in as admin, or create a Coach user (User Management) with a `coachName` that exactly matches a Coach Name in the sheet.

## Rules

- **No averages** — all metrics use distribution counts and percentages (L1–L4).
- **Average Score column** from the sheet is never used.
- **Coach name** on user accounts must exactly match the sheet; use the dropdown when creating Coach users.
