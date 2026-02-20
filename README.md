# Coach Performance Dashboard

Role-based dashboard for coach performance evaluations. **Admin** sees org-wide analytics and user management; **Coach** sees only their developers.

## Setup

1. **Database (Supabase)**  
   - Create a project at [supabase.com](https://supabase.com).
   - In **Project Settings → Database**, copy the **Connection string (URI)**. Use the **Transaction** pooler (port 6543) for Prisma.
   - Create a `.env` and set `DATABASE_URL` to that URI (replace `[YOUR-PASSWORD]` with your database password).

2. **Environment**  
   In `.env` also set:
   - `AUTH_SECRET` — min 32 chars (e.g. `openssl rand -base64 32`)
   - `AUTH_URL` — `http://localhost:3000` locally, or `https://your-app.vercel.app` in production

3. **Schema & seed**  
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
