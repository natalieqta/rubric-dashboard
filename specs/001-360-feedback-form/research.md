# Research: 360° Feedback Form

**Feature**: 001-360-feedback-form  
**Date**: 2025-02-19

## 1. Where to store 360 form submissions

**Decision**: Store submissions in a single JSON file at `data/feedback-360.json` (array of submission objects). No new database or external service.

**Rationale**:
- Constitution V (Simplicity): avoid adding persistence layers unless clearly required. Current app already uses `data/evaluations.json` and in-memory users; a second JSON file is consistent and easy to version/deploy.
- Constitution II (Single source of truth): the *read* path is what must be unified. By merging 360 data in `lib/evaluations.ts` (or a dedicated reader that the evaluations module uses), all dashboard reads still go through one layer. The *write* path for 360 can be a separate file.
- Operational: JSON file is human-inspectable, works with existing static-import or readFile patterns, and avoids schema migrations. For scale (hundreds per quarter), a single file remains manageable; if volume grows, the merge interface allows swapping to a DB later without changing consumers.

**Alternatives considered**:
- **Extend `data/evaluations.json`**: Add 360 rows with a `source: "360"` discriminator. Rejected: mixes two different lifecycles (bulk import vs form submit) and would require careful handling of overwrites (replace by rater-subject-quarter) in a single array; separate file keeps concerns clear.
- **Database (e.g. SQLite/Postgres)**: Rejected for MVP; constitution favors simplicity. Can revisit if retention or query needs grow.

---

## 2. How to merge 360 data with existing evaluations for the dashboard

**Decision**: Introduce a 360 reader (e.g. `lib/feedback-360.ts`) that loads `data/feedback-360.json`, normalizes records to the same shape as coach evaluations (same five dimensions, same score 1–4, quarter from timestamp), and expose a single function used by `lib/evaluations.ts` to return “evaluations + 360” for dashboard consumption. Dashboard and existing snapshot logic continue to use distribution-only metrics; 360 rows are treated as additional evaluation records for the same subject/quarter (with rater role and rater id for filtering and display).

**Rationale**:
- Constitution II: one read path. Evaluations module (or a thin wrapper) remains the only place that builds the combined dataset.
- Constitution I: 360 records contribute to counts per level; no average is computed. Same dimension keys and score scale as existing schema.
- Coach scoping: subject of 360 is a consultant name; coach sees only subjects that are their developers (same as today). Rater identity is stored and shown to admin/coach per spec.

**Alternatives considered**:
- **Separate dashboard “tab” for 360**: Could show 360-only views. Spec requires 360 to *feed* the same dashboard (distribution metrics); so merge is required. A dedicated “Submissions” or “360 list” view is additive (filter by quarter/month, show rater identity) and does not replace the merge.

---

## 3. Period and filtering (quarter vs month)

**Decision**: Use existing `lib/quarters.ts` for quarter from submission timestamp. Uniqueness key: (raterId, subjectName, quarterKey). For “filter by calendar month”, derive year-month from timestamp when reading; filter UI and list endpoints accept optional `quarter` and/or `month` (e.g. `month=2025-02`) and filter the 360 list accordingly. Dashboard distribution views can continue to use quarter; submissions list view supports both quarter and month filters per FR-012.

**Rationale**:
- Aligns with spec: period for replacement = dashboard quarter; users can filter by quarter or by calendar month.
- No new calendar library; quarter logic already centralized; month is trivial (getFullYear(), getMonth()+1).

---

## 4. Who can submit the form (access control)

**Decision**: Reuse existing auth (NextAuth). Only authenticated users can open the form. “Allowed to submit” is determined by role: any authenticated user with role Admin or Coach can submit; optionally extend to a fixed “rater roles” allow-list (e.g. Product, Tech Lead as labels, stored in user or derived from a simple config). MVP: allow all authenticated users to submit (or restrict to users who have a role in the system). Rater role on the form (Coach / Product / Tech Lead / Team Member) is a form field, not the app user role—so a Coach user can submit as “Team Member” for a different relationship. Admin can later restrict “who can submit” via a small config or allow-list if needed (P3).

**Rationale**:
- Spec FR-008: “only users who are allowed to submit”. Simplest MVP is “all authenticated”; refine in P3 when admin “manage who can submit” is implemented.
- Rater identity: session user id and name stored with submission so admins/coaches can see who submitted (FR-010).

---

## 5. Canonical subject list

**Decision**: Subject list for the form dropdown = same as “consultants/developers” used by the dashboard. Derive from existing evaluation data: distinct “Consultant Being Evaluated” (consultantName) from `getParsedEvaluations()` (or a dedicated `getCanonicalSubjectNames()` that uses the same source). No free-text; FR-008 and clarifications require canonical list only. If the app later maintains a separate “people” list, it can replace this derivation; for now, evaluation data is the source of truth for “who can be a subject”.

**Rationale**:
- Constitution IV: coach name consistency; subject list from same data the dashboard uses keeps coach–developer association correct.
- Spec: “only subjects from the canonical list selectable”.

---

## Summary

| Topic | Decision |
|-------|----------|
| Storage for 360 | `data/feedback-360.json` (array of submission objects) |
| Merge with evaluations | 360 reader in lib; merge in evaluations layer; single read path for dashboard |
| Period / filter | Quarter from timestamp for uniqueness; filter by quarter or year-month in list views |
| Access control | Authenticated users; rater role = form field; rater identity stored for admin/coach |
| Subject list | From same canonical list as dashboard (e.g. consultant names from evaluation data) |
