# Tasks: 360° Feedback Collection Form

**Input**: Design documents from `specs/001-360-feedback-form/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in spec; no test tasks included.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/`, `lib/`, `data/` at repository root (Next.js App Router)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Data file and types needed for 360 feature

- [ ] T001 Create `data/feedback-360.json` with initial content `[]` at repository root
- [ ] T002 [P] Add `Feedback360Submission` type and `RATER_ROLES` constant to `lib/schema.ts` per data-model.md (id, raterId, raterName, raterRole, subjectName, quarterKey, timestamp, five dimension scores and optional assertions)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 360 storage, canonical subject list, and submit/replace logic. All user stories depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Implement `lib/feedback-360.ts`: load and save `data/feedback-360.json` (readFile/writeFile or static import + write path), with type `Feedback360Submission[]`
- [ ] T004 Implement `getCanonicalSubjectNames()` in `lib/feedback-360.ts` (or `lib/evaluations.ts`): return distinct consultant names from parsed evaluation data for form subject dropdown; reuse existing parsing
- [ ] T005 Implement `submitFeedback360(payload, session)` in `lib/feedback-360.ts`: validate subject in canonical list and scores 1–4; derive quarterKey from current date via `lib/quarters.ts`; if record exists for (raterId, subjectName, quarterKey) replace it, else append; return saved record with id and quarterKey
- [ ] T006 Implement `listFeedback360(options?: { quarter?: string; month?: string; coachName?: string })` in `lib/feedback-360.ts`: return submissions filtered by quarter and/or month (year-month); coachName used later by API for coach scoping (filter subjects to that coach’s developers)

**Checkpoint**: Foundation ready — form API and merge can be built

---

## Phase 3: User Story 1 - Submit feedback about a colleague (Priority: P1) 🎯 MVP

**Goal**: Authenticated user can open the 360 form, select subject (from canonical list) and rater role, rate on five dimensions (1–4), optionally add assertions, submit; submission is stored (replace if same rater/subject/quarter) and user sees confirmation.

**Independent Test**: Submit one full form; verify record in `data/feedback-360.json` and confirmation shown; no draft on refresh.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Add `app/api/feedback/route.ts`: POST — require auth (session), validate body (subjectName in canonical list, raterRole in RATER_ROLES, five scores 1–4), call `submitFeedback360`, return 201 with id/quarterKey/message or 400/401
- [ ] T008 [P] [US1] Add `app/api/feedback/subjects/route.ts`: GET — require auth, return `{ subjects: getCanonicalSubjectNames() }` (or call lib that returns canonical list)
- [ ] T009 [US1] Add `app/dashboard/feedback/page.tsx`: server component that fetches subjects (or pass from layout); render client form component with subject dropdown (from API or props), rater role dropdown (Coach | Product | Tech Lead | Team Member), five dimension score inputs (1–4 using same labels as `lib/schema.ts`), optional assertion text fields per dimension, submit button; on submit POST to `/api/feedback`, show success message or validation errors; no draft persistence (FR-011)
- [ ] T010 [US1] Add "360 Feedback" (or "Feedback") link to dashboard nav in `app/dashboard/DashboardNav.tsx` (and/or `app/dashboard/layout.tsx`) so authenticated Admin and Coach can reach `/dashboard/feedback`

**Checkpoint**: User Story 1 complete — user can submit 360 form and see confirmation; submission visible in data file

---

## Phase 4: User Story 2 - View and use 360 data on the dashboard (Priority: P2)

**Goal**: Dashboard views use merged evaluation + 360 data; metrics remain distribution-based (counts/percentages per level); no averages; coach sees only their developers, admin sees org-wide.

**Independent Test**: After at least one 360 submission exists, open dashboard view for that subject/quarter; distribution counts include the 360 submission; no average score shown.

### Implementation for User Story 2

- [ ] T011 [US2] Add merge layer in `lib/evaluations.ts` (or `lib/feedback-360.ts`): expose function that returns evaluation-like records for dashboard (e.g. `getMergedRecordsForDashboard(options?: { coachName?: string })`) combining `getDeveloperQuarterSnapshots` / parsed evaluations with normalized 360 submissions from `listFeedback360`, scoped by coachName for coach (subjects = their developers) or org-wide for admin; ensure 360 records map to same subject/quarter shape so distribution logic can count by level
- [ ] T012 [US2] Update dashboard pages that show evaluation/distribution data to use merged data from the new function (e.g. org overview, risk, coach effectiveness, trends, coach detail) in `app/dashboard/admin/page.tsx`, `app/dashboard/admin/risk/page.tsx`, `app/dashboard/admin/coaches/page.tsx`, `app/dashboard/admin/coach-trends/page.tsx`, `app/dashboard/admin/trends/page.tsx`, and coach-side pages as needed so distribution counts include 360; confirm no average score is computed or displayed (Constitution I)
- [ ] T013 [US2] Ensure coach-scoped dashboard views only receive 360 data for subjects who are their developers (same consultant list as existing coach scope) in the merge layer or API used by those pages

**Checkpoint**: User Story 2 complete — dashboard shows 360 in distributions; role-based scoping preserved; no averages

---

## Phase 5: User Story 3 - Manage who can submit and about whom (Priority: P3)

**Goal**: Admin (and coach for their scope) can view list of 360 submissions with filters (quarter, month) and see rater identity per submission; subject list remains canonical only (already enforced in US1).

**Independent Test**: Admin opens submissions view, filters by quarter and by month, sees submission count and list with rater name; coach sees only submissions for their developers.

### Implementation for User Story 3

- [ ] T014 [US3] Add GET handler in `app/api/feedback/route.ts`: require auth; if Admin return all submissions from `listFeedback360`, if Coach return only submissions where subject is in that coach’s developer list (use existing coach–developer mapping); accept query params `quarter` and `month`, pass to `listFeedback360`; return `{ submissions }` with rater identity (raterId, raterName) per submission
- [ ] T015 [P] [US3] Add `app/dashboard/admin/feedback/page.tsx` (or `app/dashboard/feedback/submissions/page.tsx`): page that fetches GET `/api/feedback` with optional `quarter` and `month`; display table or list of submissions (subject, rater name, rater role, quarter, timestamp, dimension scores); include filter controls for quarter and month (both options per FR-012); link from admin nav
- [ ] T016 [US3] Add "360 Submissions" (or "Submissions") link in `app/dashboard/DashboardNav.tsx` for Admin (and Coach, to same view scoped by API) pointing to the submissions page

**Checkpoint**: User Story 3 complete — admin/coach can view and filter submissions with rater identity

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, errors, and quickstart verification

- [ ] T017 Add validation and clear error messages in `app/api/feedback/route.ts` POST for missing fields, invalid scores, subject not in list (400 with actionable message per SC-005)
- [ ] T018 [P] Ensure unauthorized access to `app/dashboard/feedback` and submissions page returns redirect to login or 401 (auth check in layout or page)
- [ ] T019 Run through quickstart.md verification steps: submit form, check data file, view submissions list with filters, confirm dashboard includes 360 in distribution and no averages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — form and submit; no dependency on US2/US3
- **Phase 4 (US2)**: Depends on Phase 2 and optionally Phase 3 (need 360 data to merge); can start after T005–T006
- **Phase 5 (US3)**: Depends on Phase 2; list/filter API and UI; can start after T006
- **Phase 6 (Polish)**: Depends on Phase 3–5 as needed

### User Story Dependencies

- **US1 (P1)**: After Foundational only — independently testable (submit form, see record)
- **US2 (P2)**: After Foundational; merge and dashboard — independently testable (view dashboard with 360 in distributions)
- **US3 (P3)**: After Foundational; uses same listFeedback360 — independently testable (view/filter submissions list)

### Within Each User Story

- API route (POST/GET) before or with page that calls it
- Form page consumes subjects API and submit API
- Merge layer before dashboard pages use it

### Parallel Opportunities

- T001 and T002 can run in parallel
- T007 and T008 can run in parallel
- T015 and T017/T018 can run in parallel with other polish
- Different user stories (US2 and US3) can be implemented in parallel after Phase 2

---

## Parallel Example: User Story 1

```text
# After Phase 2 complete, in parallel:
T007: Implement POST in app/api/feedback/route.ts
T008: Implement GET in app/api/feedback/subjects/route.ts

# Then:
T009: Build form page (depends on T007, T008)
T010: Add nav link
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (User Story 1)
4. **STOP and VALIDATE**: Submit a 360 form, confirm record in `data/feedback-360.json`, confirm confirmation message
5. Demo/deploy if ready

### Incremental Delivery

1. Phase 1 + 2 → foundation ready
2. Add US1 → test submit and confirm (MVP)
3. Add US2 → test dashboard with 360 in distributions
4. Add US3 → test submissions list with filters and rater identity
5. Phase 6 → validation and quickstart pass

### Parallel Team Strategy

- After Phase 2: Developer A — US1 (form + API); Developer B — US2 (merge + dashboard); Developer C — US3 (list API + submissions page)
- Integrate and run Phase 6

---

## Notes

- [P] = different files, no dependencies
- [USn] maps task to user story for traceability
- No test tasks (spec did not request TDD or explicit tests)
- Commit after each task or logical group
- Constitution: distribution-only (no averages), single read path (merge in lib), coach/admin scoping, canonical subject list
