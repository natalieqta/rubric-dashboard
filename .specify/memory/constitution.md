# Rubric Dashboard Constitution
<!-- Sync Impact: Initial constitution v1.0.0. No prior version. -->

## Core Principles

### I. Distribution-Only Metrics (NON-NEGOTIABLE)
All dashboard metrics MUST use distribution counts and percentages across the four levels (L1–L4: Below Expectations, Progressing, Meets Expectations, Exceeds Expectations). The "Average Score" column from the source data MUST NOT be used for any chart, KPI, or decision. Rationale: Averages hide risk and skew; distributions expose who needs support and trends.

### II. Single Source of Truth for Evaluations
Evaluation data has exactly one source: `data/evaluations.json`. All reads MUST go through `lib/evaluations.ts` (and related parsing/schema in `lib/`). No ad-hoc parsing of the JSON elsewhere. Rationale: Ensures consistent quartering, coach filtering, and caching; avoids drift between views.

### III. Role-Based Access and Scoping
Admin sees org-wide data and user management; Coach sees only data for their own `coachName`. All queries and UI MUST respect session role and coach scoping. Coach user accounts MUST have `coachName` that exactly matches a Coach Name present in the evaluation data (case-sensitive). Rationale: Protects confidentiality and keeps coach views relevant.

### IV. Coach Name Consistency
Coach names in the app (dropdowns, filters, user creation) MUST match the values in the evaluation data exactly. Use the same canonical list (e.g. `getUniqueCoachNames()`) everywhere. Hidden coaches are configured in code (`HIDDEN_COACH_NAMES`) and excluded from lists and dashboards. Rationale: Prevents broken filters and mismatched coach–developer associations.

### V. Simplicity and Maintainability
Prefer simple, readable code over clever abstractions. Avoid adding dependencies or persistence layers unless clearly required. New features MUST align with existing patterns (Next.js App Router, server components for data, client components for interactivity). Rationale: Keeps the dashboard fast to change and easy for the team to own.

## Data and Schema Constraints

- **Evaluation dimensions** are fixed: Tech Mastery, Build Trust, Resilient Under Stress, Team Player, Move Fast. Any new dimension or renamed dimension requires a schema and data-import change and MUST be reflected in `lib/parse.ts` and `lib/schema.ts`.
- **Quarters** are derived from evaluation timestamps (e.g. 2025-Q2). Quarter logic MUST stay centralized (e.g. in parsing) so all pages share the same definition.
- **User/store**: The app MAY use an in-memory user store or a future persistence layer. Auth (NextAuth) and role/coach scoping MUST remain the gate for all protected routes and APIs.

## Development Workflow

- **Specs and plans**: When adding a new dashboard view or metric, the spec MUST state how it complies with Principle I (distribution-only, no averages) and Principle III (scoping).
- **Data changes**: Changing the shape of `evaluations.json` or the parsing logic MUST be accompanied by updated types in `lib/schema.ts` and any affected dashboard components.
- **Review**: Changes that touch evaluation aggregation, coach filtering, or role checks MUST be reviewed for constitution compliance (no averages, correct scoping, coach name consistency).

## Governance

This constitution supersedes ad-hoc decisions for metrics and data usage. Amendments require updating this file, bumping the version, and updating the "Last Amended" date. When adding or changing principles, update any Spec Kit templates that reference them (plan, spec, tasks). All PRs that affect evaluations or dashboard metrics MUST verify compliance with Principles I–IV.

**Version**: 1.0.0 | **Ratified**: 2025-02-19 | **Last Amended**: 2025-02-19
