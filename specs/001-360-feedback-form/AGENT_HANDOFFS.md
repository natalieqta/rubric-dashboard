# Agent handoffs: 3-way parallel build (360° Feedback Form)

Use these prompts to spin up 3 agents. **Agent 1 must finish Phase 1 + 2 before the others can start** (or others can start once `data/feedback-360.json`, `lib/schema.ts` types, and `lib/feedback-360.ts` exist in the repo).

**Merge order**: Merge Agent 1’s branch first (foundation). Then merge Agent 2 and Agent 3 in either order (they touch different files). If Agent 2 and 3 both change `app/dashboard/DashboardNav.tsx`, resolve nav links when merging.

---

## Agent 1 — Foundation + Submissions page (US3)

**Copy this into Agent 1’s instructions:**

```
You are implementing the 360° Feedback Form feature for the rubric dashboard. Your scope is:

1) **Phase 1 & 2 (do first — others depend on this)**  
   Work from `specs/001-360-feedback-form/tasks.md` and implement in this repo:
   - T001: Create `data/feedback-360.json` with content `[]`.
   - T002: In `lib/schema.ts` add type `Feedback360Submission` and constant `RATER_ROLES` per `specs/001-360-feedback-form/data-model.md` (all fields: id, raterId, raterName, raterRole, subjectName, quarterKey, timestamp, five dimension scores 1–4, optional assertion strings).
   - T003: Create `lib/feedback-360.ts` that loads and saves `data/feedback-360.json` (use Node readFile/writeFile or equivalent), typed as `Feedback360Submission[]`.
   - T004: In `lib/feedback-360.ts` implement `getCanonicalSubjectNames()`: return distinct consultant names from existing evaluation data (use `lib/evaluations.ts` / getParsedEvaluations or equivalent).
   - T005: In `lib/feedback-360.ts` implement `submitFeedback360(payload, session)`: validate subject in canonical list and all five scores 1–4; derive quarterKey from current date via `lib/quarters.ts`; if a record exists for (raterId, subjectName, quarterKey) replace it, else append; return saved record with id and quarterKey.
   - T006: In `lib/feedback-360.ts` implement `listFeedback360(options?: { quarter?, month?, coachName? })`: return submissions filtered by quarter and/or month (year-month); support coachName for later coach scoping.

2) **After Phase 2 is done**  
   - T015: Add `app/dashboard/admin/feedback/page.tsx` (or `app/dashboard/feedback/submissions/page.tsx`): page that fetches GET `/api/feedback` with optional `quarter` and `month`; show a table/list of submissions (subject, rater name, rater role, quarter, timestamp, scores); add filter controls for quarter and month.
   - T016: In `app/dashboard/DashboardNav.tsx` add a "360 Submissions" (or "Submissions") link for Admin and Coach pointing to that submissions page.

Reference: `specs/001-360-feedback-form/` (spec.md, data-model.md, contracts/api-feedback.md, plan.md). Constitution: no averages; single read path; coach/admin scoping.
```

---

## Agent 2 — Form + feedback API (US1 + GET list)

**Copy this into Agent 2’s instructions:**

```
You are implementing the 360° Feedback Form feature for the rubric dashboard. Your scope is the form and the feedback API. **Start only after Phase 2 exists in the repo** (i.e. `data/feedback-360.json`, `lib/schema.ts` with `Feedback360Submission` and `RATER_ROLES`, and `lib/feedback-360.ts` with `submitFeedback360`, `listFeedback360`, `getCanonicalSubjectNames`). If those are missing, implement only the API routes that call them and assume the lib exists.

1) **API routes** (from `specs/001-360-feedback-form/contracts/api-feedback.md`)  
   - T007: Add `app/api/feedback/route.ts` with POST: require NextAuth session; validate body (subjectName in canonical list, raterRole in RATER_ROLES, five scores 1–4); call `submitFeedback360` from `lib/feedback-360.ts`; return 201 with id/quarterKey/message or 400/401.
   - T008: Add `app/api/feedback/subjects/route.ts` with GET: require auth; return `{ subjects: getCanonicalSubjectNames() }` from `lib/feedback-360.ts`.
   - T014: In the same `app/api/feedback/route.ts` add GET: require auth; if Admin return all from `listFeedback360`, if Coach return only submissions where subject is in that coach’s developer list; accept query params `quarter` and `month`; return `{ submissions }` with rater identity (raterId, raterName) per submission.

2) **Form page and nav**  
   - T009: Add `app/dashboard/feedback/page.tsx`: server or client page with a form: subject dropdown (from GET `/api/feedback/subjects`), rater role dropdown (Coach | Product | Tech Lead | Team Member), five dimension score inputs (1–4, same labels as `lib/schema.ts`), optional assertion text per dimension, submit button; on submit POST to `/api/feedback`, show success or validation errors; do not persist drafts (FR-011).
   - T010: In `app/dashboard/DashboardNav.tsx` add a "360 Feedback" or "Feedback" link so authenticated Admin and Coach can reach `/dashboard/feedback`.

3) **Polish (optional in same run)**  
   - T017: In `app/api/feedback/route.ts` POST add validation and clear 400 error messages for missing fields, invalid scores, subject not in list (per SC-005).

Reference: `specs/001-360-feedback-form/` (spec.md, data-model.md, contracts/api-feedback.md). Constitution: distribution-only metrics; single read path; role-based scoping.
```

---

## Agent 3 — Merge 360 into dashboard (US2)

**Copy this into Agent 3’s instructions:**

```
You are implementing the 360° Feedback Form feature for the rubric dashboard. Your scope is merging 360 submissions into the dashboard so metrics stay distribution-based (no averages) and role-based scoping is preserved. **Start only after Phase 2 exists in the repo** (i.e. `lib/feedback-360.ts` with `listFeedback360` and the rest of the foundation). If the lib is missing, implement the merge and dashboard usage assuming `listFeedback360(options)` and existing `getDeveloperQuarterSnapshots` / evaluation parsing exist.

1) **Merge layer**  
   - T011: In `lib/evaluations.ts` (or `lib/feedback-360.ts`) add a function that returns evaluation-like records for the dashboard (e.g. `getMergedRecordsForDashboard(options?: { coachName? })`): combine existing snapshot/evaluation data with normalized 360 submissions from `listFeedback360`, scoped by coachName for coach (only their developers) or org-wide for admin; ensure 360 records map to the same subject/quarter shape so distribution logic can count by level. No averages (Constitution I).

2) **Wire dashboard to merged data**  
   - T012: Update dashboard pages that show evaluation/distribution data to use the new merged function: `app/dashboard/admin/page.tsx`, `app/dashboard/admin/risk/page.tsx`, `app/dashboard/admin/coaches/page.tsx`, `app/dashboard/admin/coach-trends/page.tsx`, `app/dashboard/admin/trends/page.tsx`, and coach-side pages as needed. Ensure distribution counts include 360 and no average score is computed or displayed.
   - T013: In the merge layer or data flow, ensure coach-scoped views only receive 360 data for subjects who are their developers (same consultant list as existing coach scope).

Reference: `specs/001-360-feedback-form/` (spec.md, plan.md, data-model.md). Constitution: distribution-only metrics (I); single read path (II); role-based scoping (III).
```

---

## After all three merge

- **Phase 6**: One agent or you run T018 (auth check for `/dashboard/feedback` and submissions page) and T019 (quickstart verification: submit form, check data file, submissions list filters, dashboard shows 360 in distributions, no averages).
- If Agent 2 and Agent 1 both edit `DashboardNav.tsx`, merge both nav links (360 Feedback + 360 Submissions) into one nav section.

## Summary

| Agent | Scope | Blocks / blocked by |
|-------|--------|----------------------|
| **1** | Phase 1+2 (T001–T006), then US3 submissions page (T015, T016) | Blocks 2 and 3 until Phase 2 is merged |
| **2** | US1 form + API (T007–T010) + GET list (T014) + optional T017 | Blocked by Phase 2; owns `app/api/feedback/route.ts` |
| **3** | US2 merge + dashboard (T011–T013) | Blocked by Phase 2; owns `lib/evaluations.ts` (or merge in feedback-360) and dashboard pages |
