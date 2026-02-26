# Data Model: 360° Feedback Form

**Feature**: 001-360-feedback-form  
**Date**: 2025-02-19

## Entities

### FeedbackSubmission (360 form submission)

Single form response stored in `data/feedback-360.json` (array of records). One record per submission; replacement for same (raterId, subjectName, quarterKey) is implemented by overwriting that record on submit.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | yes | Unique id (e.g. cuid or uuid) for the submission. |
| raterId | string | yes | Authenticated user id (session) who submitted. |
| raterName | string | yes | Human-readable name of rater (for admin/coach display). |
| raterRole | enum | yes | One of: Coach | Product | Tech Lead | Team Member. |
| subjectName | string | yes | Full name of person evaluated; MUST match canonical list. |
| quarterKey | string | yes | Dashboard quarter, e.g. "2025-Q1" (from submission timestamp). |
| timestamp | string (ISO) | yes | When the form was submitted. |
| techMastery | 1 \| 2 \| 3 \| 4 | yes | Score for Tech Mastery. |
| techMasteryAssertions | string | no | Optional free text. |
| buildTrust | 1 \| 2 \| 3 \| 4 | yes | Score for Build Trust. |
| buildTrustAssertions | string | no | Optional. |
| resilientUnderPressure | 1 \| 2 \| 3 \| 4 | yes | Score for Resilient Under Pressure. |
| resilientUnderPressureAssertions | string | no | Optional. |
| teamPlayer | 1 \| 2 \| 3 \| 4 | yes | Score for Team Player. |
| teamPlayerAssertions | string | no | Optional. |
| moveFast | 1 \| 2 \| 3 \| 4 | yes | Score for Move Fast. |
| moveFastAssertions | string | no | Optional. |

**Uniqueness**: One submission per (raterId, subjectName, quarterKey). On submit, if a record exists for that triple, replace it (same id or new id; implementation may replace in-place or remove + append).

**Validation rules** (from spec):
- subjectName must be in canonical subject list (derived from evaluation data).
- All five dimension scores required and in 1–4.
- raterRole from fixed set.
- No draft/partial: only full submissions are stored.

---

### Subject (person being evaluated)

Not a separate stored entity. **Canonical list**: derived from existing evaluation data (e.g. distinct `consultantName` from parsed evaluations). Used for:
- Form subject dropdown (only these names selectable).
- Coach scoping: coach sees only 360 for subjects who are their developers (same mapping as today).
- Merging 360 into dashboard: subjectName links to same developer/consultant in existing snapshots.

---

### Rater

Identified by session (user id + name). Stored on each FeedbackSubmission as raterId and raterName. Used for:
- Access control: only authenticated users can submit.
- FR-010: admins and coaches can see who submitted each piece of feedback.
- Uniqueness: (raterId, subjectName, quarterKey).

---

## State transitions

- **Create**: User submits full form → new FeedbackSubmission record (or replace existing for same raterId + subjectName + quarterKey).
- **Read**: List/filter by quarter or month; merge into evaluation pipeline for dashboard.
- **Update**: Only via replace (resubmit same rater/subject/quarter).
- **Delete**: Not in MVP scope; can be added later for admin corrections.

---

## File format: data/feedback-360.json

```json
[
  {
    "id": "cuid-xxx",
    "raterId": "user-id-from-session",
    "raterName": "Jane Doe",
    "raterRole": "Coach",
    "subjectName": "Ruvi Raghavan",
    "quarterKey": "2025-Q1",
    "timestamp": "2025-02-19T12:00:00.000Z",
    "techMastery": 3,
    "techMasteryAssertions": "Optional text",
    "buildTrust": 3,
    "buildTrustAssertions": "",
    "resilientUnderPressure": 3,
    "resilientUnderPressureAssertions": "",
    "teamPlayer": 4,
    "teamPlayerAssertions": "",
    "moveFast": 3,
    "moveFastAssertions": ""
  }
]
```

---

## Integration with existing schema

- Reuse `DimensionKey`, `Score`, `SCORE_LABELS`, `DIMENSION_LABELS` from `lib/schema.ts`.
- 360 submissions are normalized to a shape compatible with `ParsedEvaluation` (or a parallel type `Feedback360Record`) so that the merge layer can produce a unified list of “evaluation-like” records for the dashboard without computing averages; dashboard continues to use distribution counts only.
