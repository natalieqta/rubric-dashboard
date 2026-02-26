# API Contract: 360 Feedback

**Feature**: 001-360-feedback-form  
**Base path**: `/api/feedback` (or `/api/360`)

All endpoints require authentication (NextAuth session). Role-based: Admin can see all submissions; Coach can see only submissions for their developers (subject in their scope).

---

## POST /api/feedback

Submit a 360 feedback form. One submission per (raterId, subjectName, quarterKey); if one exists, replace it.

**Request**
- **Content-Type**: `application/json`
- **Body**:
  - `subjectName`: string (required) — must be from canonical subject list
  - `raterRole`: "Coach" | "Product" | "Tech Lead" | "Team Member" (required)
  - `techMastery`: 1 | 2 | 3 | 4 (required)
  - `techMasteryAssertions`: string (optional)
  - `buildTrust`: 1 | 2 | 3 | 4 (required)
  - `buildTrustAssertions`: string (optional)
  - `resilientUnderPressure`: 1 | 2 | 3 | 4 (required)
  - `resilientUnderPressureAssertions`: string (optional)
  - `teamPlayer`: 1 | 2 | 3 | 4 (required)
  - `teamPlayerAssertions`: string (optional)
  - `moveFast`: 1 | 2 | 3 | 4 (required)
  - `moveFastAssertions`: string (optional)

**Response**
- **201**: `{ "id": "<submission-id>", "quarterKey": "2025-Q1", "message": "Feedback recorded." }`
- **400**: `{ "error": "<message>" }` — validation (e.g. subject not in list, invalid score)
- **401**: Unauthorized

**Side effect**: Append or replace record in `data/feedback-360.json`; quarterKey derived from server timestamp.

---

## GET /api/feedback

List 360 submissions with optional filters. Admin: all; Coach: only submissions where subject is in their developer list.

**Query**
- `quarter`: string (optional) — e.g. `2025-Q1` (dashboard quarter)
- `month`: string (optional) — e.g. `2025-02` (year-month). If both quarter and month present, implementation may apply both (e.g. filter by quarter and by month).

**Response**
- **200**: `{ "submissions": [ { FeedbackSubmission } ] }` — array of submission objects (see data-model.md). Scoped by role; filtered by quarter and/or month when provided.
- **401**: Unauthorized

---

## Canonical subject list (for form dropdown)

**GET /api/feedback/subjects** (or derived from existing evaluation API / server component)

Returns list of names that can be selected as "subject" on the form. Same source as dashboard canonical list (e.g. distinct consultant names from evaluation data).

**Response**
- **200**: `{ "subjects": [ "<name1>", "<name2>", ... ] }`
- **401**: Unauthorized
