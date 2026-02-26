# Quickstart: 360° Feedback Form

**Feature**: 001-360-feedback-form

## Prerequisites

- Repo at branch `001-360-feedback-form`
- `npm install` and `.env` with `AUTH_SECRET`, `AUTH_URL` (see root README)
- Default admin user (e.g. admin@lumenalta.com / changeme123) or a Coach user

## Run the app

```bash
npm run dev
```

Open http://localhost:3000 and sign in.

## Implementing this feature (developer)

1. **Data file**: Create `data/feedback-360.json` with initial content `[]`.
2. **Lib**: Add `lib/feedback-360.ts` (or similar) to:
   - Read/write `data/feedback-360.json`
   - Implement replace-by (raterId, subjectName, quarterKey)
   - Export `getCanonicalSubjectNames()` (from evaluation data) for the form dropdown
3. **API**: Add `app/api/feedback/route.ts`: GET (list, filter by quarter/month), POST (submit). Add `app/api/feedback/subjects/route.ts` for subject list if separate from evaluations.
4. **Merge**: In `lib/evaluations.ts` (or a wrapper), merge 360 submissions into the data used for dashboard snapshots so distribution metrics include 360; ensure no averages (Constitution I). Preserve coach scoping (only their developers).
5. **UI**: Add feedback form page (e.g. `app/dashboard/feedback/page.tsx` or under admin/coach): subject dropdown (canonical list), rater role dropdown, five dimension score inputs (1–4), optional assertion text fields, submit button. Add submissions list view for admin/coach with filters (quarter, month) and rater identity visible.
6. **Nav**: Link “360 Feedback” (form and/or submissions) from dashboard nav for Admin and Coach.

## Verify

- Submit a 360 form as an authenticated user; confirm 201 and record in `data/feedback-360.json`.
- As admin, open submissions list; filter by quarter and by month; see rater identity.
- As coach, open submissions list; see only submissions for your developers.
- Open a dashboard view that uses merged data; confirm 360 submission contributes to distribution (e.g. counts per level) and no average is shown.

## Constitution

- All metrics distribution-only (no averages).
- All evaluation-like reads through one lib path (evaluations + 360 merge).
- Coach sees only their developers; admin sees org-wide.
- Subject list from canonical list only.
