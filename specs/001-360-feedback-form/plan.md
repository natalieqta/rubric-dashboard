# Implementation Plan: 360° Feedback Collection Form

**Branch**: `001-360-feedback-form` | **Date**: 2025-02-19 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-360-feedback-form/spec.md`

## Summary

Add a 360° feedback form filled out by coaches, product, tech leads, and team members about a subject (person). Submissions are stored and merged with existing evaluation data so the dashboard can show distribution-based metrics (no averages) with role-based scoping. One submission per rater-subject-quarter (new replaces previous); no drafts; subject from canonical list only; filter by quarter or calendar month. Technical approach: store 360 submissions in a JSON file; extend the evaluation read layer to merge 360 data so all dashboard reads remain distribution-only and scoped (Constitution II, I, III).

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 16, React 19, NextAuth 5 (beta), recharts, bcryptjs  
**Storage**: Existing: `data/evaluations.json` (evaluations), in-memory user store. New: `data/feedback-360.json` (360 form submissions); all evaluation-like reads go through `lib/evaluations.ts` (and a 360 merge layer).  
**Testing**: No formal test framework in repo; manual / E2E for MVP.  
**Target Platform**: Web (Next.js); server and client components.  
**Project Type**: Web application (Next.js App Router).  
**Performance Goals**: Form submit &lt; 3 s; dashboard with merged 360 data &lt; 2 s load (aligned with SC-001, SC-002).  
**Constraints**: No averages (Constitution I); single read path for evaluation data (Constitution II); coach/admin scoping (Constitution III).  
**Scale/Scope**: Internal company use; hundreds of submissions per quarter; same scale as existing evaluations.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | This Feature |
|-----------|-------------|--------------|
| I. Distribution-only metrics | No averages; metrics as counts/percentages per level (L1–L4). | 360 data merged into existing pipeline; dashboard shows only distributions. No average score for 360. |
| II. Single source of truth | All evaluation reads via `lib/evaluations.ts` (and related parsing). | 360 stored in `data/feedback-360.json`; merged in lib layer so all consumption goes through one read path. |
| III. Role-based access | Admin org-wide; Coach only their developers. | Form and submission list gated by auth; coaches see only 360 for their developers. |
| IV. Coach name consistency | Canonical list; no ad-hoc names. | Subject dropdown from same canonical list as dashboard (e.g. from evaluation data). |
| V. Simplicity | Avoid new persistence unless required; align with existing patterns. | JSON file for 360; no new DB; App Router server/client components. |

**Result**: PASS. No violations.

*Post Phase 1 design:* 360 stored in `data/feedback-360.json`; merge in lib layer; no averages; coach/admin scoping preserved. Constitution check remains PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-360-feedback-form/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (API contracts)
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 (/speckit.tasks — not created by plan)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── auth/[...nextauth]/
│   ├── users/           # existing
│   └── feedback/        # NEW: POST submit 360, GET list (filter by quarter/month)
├── dashboard/
│   ├── admin/           # existing; add submissions overview + filter (quarter/month)
│   ├── coach/           # existing
│   └── feedback/        # NEW: 360 form page (or under admin/feedback, coach/feedback)
├── login/
└── ...

lib/
├── evaluations.ts       # existing; extend to merge 360 (or add lib/feedback-360.ts + merge in evaluations)
├── parse.ts             # existing
├── schema.ts            # existing; add 360 submission types
├── quarters.ts          # existing (quarter + month helpers for filter)
├── db.ts                # existing (users)
└── auth.ts              # existing

data/
├── evaluations.json     # existing
└── feedback-360.json    # NEW: 360 form submissions (array of records)
```

**Structure Decision**: Single Next.js app. New surface: `app/api/feedback/` (submit + list), `app/dashboard/feedback/` or integrated into admin/coach nav for form and submissions view, `data/feedback-360.json`, and lib extensions for 360 storage + merge into evaluation pipeline.

## Complexity Tracking

No constitution violations. Table left empty.
