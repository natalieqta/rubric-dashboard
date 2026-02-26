# Feature Specification: 360° Feedback Collection Form

**Feature Branch**: `001-360-feedback-form`  
**Created**: 2025-02-19  
**Status**: Draft  
**Input**: User description: "I want to build a form that the company fills out that turns into data that feeds into this dashboard. Different ppl would fill out this form: coaches, product, tech leads, team members. The different touch points ppl have with said person would fill out the form about said person so that we can have a 360 degree feedback picture of this person."

## Clarifications

### Session 2025-02-19

- Q: When the same rater submits more than one form for the same subject in the same period, what should happen? → A: One submission per rater-subject-period; a new submission replaces the previous one (supports one per quarter plus re-submission when the person changes projects and needs to be reevaluated).
- Q: How should the system handle partial submissions (e.g. rater closes the form mid-way)? → A: Discard; no draft. Nothing is saved until the user explicitly submits the full form.
- Q: Who can see rater identity for 360 submissions? → A: Admins and coaches (for their scope) can see who submitted each piece of feedback (rater identity per submission).
- Q: When the subject is not in the canonical list (e.g. new hire, name mismatch), what should happen? → A: Only allow selection from the canonical list; no free-text subject. Add new people to the list first, then they can be selected.
- Q: How is "period" defined for 360 submissions, and how can users filter? → A: Period for submission uniqueness is the same as dashboard quarter (e.g. 2025-Q1). Users can filter (and view) 360 data by quarter or by calendar month (year-month).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit feedback about a colleague (Priority: P1)

A person with a working relationship to the subject (e.g. coach, product manager, tech lead, or team member) opens the form, selects or identifies the person they are evaluating, selects their own relationship/role to that person, and rates the subject on the same five dimensions used in the dashboard (Tech Mastery, Build Trust, Resilient Under Stress, Team Player, Move Fast) using the same four levels (Below Expectations, Progressing, Meets Expectations, Exceeds Expectations). They may add short written assertions per dimension. After submitting, they see confirmation that their feedback was recorded.

**Why this priority**: This is the core value—collecting structured 360° input from multiple touch points. Without it there is no feature.

**Independent Test**: A rater can complete and submit one full form about one subject; the submission is durably recorded and can be verified (e.g. by an admin or via a simple “view my submissions” or data export). Delivers a single complete 360 data point.

**Acceptance Scenarios**:

1. **Given** the rater is authenticated and on the feedback form, **When** they select the person being evaluated and their own role (e.g. Coach, Product, Tech Lead, Team Member), **Then** they can rate that person on all five dimensions using the same four levels as the dashboard.
2. **Given** the rater has entered at least one dimension score, **When** they submit the form, **Then** the system records the feedback with a timestamp and confirms submission.
3. **Given** the rater has submitted feedback, **When** they or an admin checks that the feedback exists (by whatever means the product provides), **Then** the submission is present and attributable to the rater role and the subject.

---

### User Story 2 - View and use 360 data on the dashboard (Priority: P2)

Admins and coaches see the existing dashboard views (org overview, risk, coach effectiveness, trends, etc.) augmented so that evaluation data used for metrics includes both existing evaluation data and 360 form submissions. Metrics remain distribution-based (counts and percentages per level); no averages are introduced. Coaches see only data for their scope (their developers); admins see org-wide.

**Why this priority**: The form is only valuable if the data feeds the dashboard. This story ensures that integration respects the existing dashboard rules (distribution-only, role-based scoping).

**Independent Test**: After at least one 360 form submission exists for a given subject and period, an admin (or coach, for their scope) can open the relevant dashboard view and see that subject’s metrics reflect the form data (e.g. distribution counts include the 360 submission). No average score is shown or used.

**Acceptance Scenarios**:

1. **Given** 360 form data exists for a subject in a given period, **When** an admin (or coach, for their developers) views the dashboard, **Then** the data used for that subject’s metrics includes the 360 submissions and all metrics are shown as distributions (e.g. counts or percentages per level), not averages.
2. **Given** the user is a coach, **When** they view any dashboard page, **Then** they see only data for developers they are responsible for (existing role-based scoping).
3. **Given** the user is an admin, **When** they view org-wide views, **Then** they see aggregated data that includes 360 form submissions where applicable.

---

### User Story 3 - Manage who can submit and about whom (Priority: P3)

An admin can control who is allowed to submit the 360 form (e.g. which roles or individuals) and which people can be selected as the subject of feedback (e.g. only people who appear in the existing evaluation data or a defined list). Optionally, admins can see a list or count of 360 submissions (e.g. per subject, per period, or per rater) to ensure coverage and follow-up.

**Why this priority**: Ensures the process is governable and prevents misuse; supports rollout and auditing.

**Independent Test**: An admin can access a management or reporting view (or equivalent) that shows either who can submit / who can be a subject, or a summary of submissions (e.g. count by subject or by period), and can verify that only allowed raters and subjects are present in the data.

**Acceptance Scenarios**:

1. **Given** the product defines allowed rater roles (e.g. Coach, Product, Tech Lead, Team Member), **When** a user opens the form, **Then** they can only submit if their role is allowed (or they are in an allowed list).
2. **Given** the product defines allowed subjects (e.g. people already in the evaluation data or a maintained list), **When** the rater selects the person being evaluated, **Then** only allowed subjects appear or can be chosen.
3. **Given** the admin has access to a submissions overview or report, **When** they open it, **Then** they can see at least submission count by subject and/or by period (or equivalent) to monitor coverage.

---

### Edge Cases

- What happens when the same rater submits more than one form for the same subject in the same period? **Resolved:** One submission per rater-subject-period; a new submission replaces the previous one (allows reevaluation when the subject changes projects).
- How does the system handle partial submissions (e.g. rater closes the form mid-way)? **Resolved:** Discard; no draft. Nothing is saved until the user explicitly submits the full form.
- What happens when the subject is not in the canonical list (e.g. name mismatch, or new hire not yet in evaluation data)? **Resolved:** Only allow selection from the canonical list; no free-text. New people must be added to the list first, then they can be selected as subjects.
- How are anonymity and confidentiality handled? **Resolved:** Admins and coaches (for their scope) can see rater identity per submission; no anonymous 360 for MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a feedback form that authenticated users can open and submit.
- **FR-002**: The form MUST capture the identity (or selection) of the person being evaluated (the subject).
- **FR-003**: The form MUST capture the rater’s relationship/role to the subject (e.g. Coach, Product, Tech Lead, Team Member) from a fixed set of options.
- **FR-004**: The form MUST collect a rating for each of the five dimensions (Tech Mastery, Build Trust, Resilient Under Stress, Team Player, Move Fast) using exactly the same four levels as the dashboard (Below Expectations, Progressing, Meets Expectations, Exceeds Expectations).
- **FR-005**: The form MAY collect optional written assertions (free text) per dimension; if present, they MUST be stored with the submission.
- **FR-006**: Each submission MUST be stored with a timestamp and MUST be attributable at least by rater role and subject so that data can feed the dashboard and respect role-based scoping (e.g. coach sees only their developers).
- **FR-007**: Data produced by the form MUST be consumable by the existing dashboard so that metrics remain distribution-based (counts/percentages per level); the system MUST NOT introduce average scores for 360 data.
- **FR-008**: Only users who are allowed to submit (e.g. by role or allow-list) MUST be able to submit the form; only subjects from the canonical list (e.g. people in evaluation data or a maintained list) MUST be selectable—no free-text subject entry.
- **FR-009**: The system MUST allow only one submission per rater, subject, and period; if the same rater submits again for the same subject and period, the new submission MUST replace the previous one (e.g. to support reevaluation when the subject changes projects). Period for this rule is the same as the dashboard quarter (e.g. 2025-Q1).
- **FR-010**: Admins MUST be able to see that 360 data exists (e.g. submission counts or list by subject/period) and MUST be able to see rater identity per submission; coaches MAY see the same for their scope only (including rater identity for submissions about their developers).
- **FR-011**: The system MUST NOT save partial or draft form state; only a full, explicitly submitted form MUST be stored.
- **FR-012**: The system MUST allow users to filter (and view) 360 submissions by dashboard quarter and by calendar month (year-month); both filter options MUST be available where 360 data is listed or reported.

### Key Entities

- **Feedback submission**: A single form response. Attributes: subject (person evaluated, from canonical list), rater (user or identifier), rater role (Coach | Product | Tech Lead | Team Member), timestamp, period (dashboard quarter for uniqueness), five dimension scores (1–4), optional assertions per dimension. Used to feed dashboard and reports; viewable/filterable by quarter or by calendar month.
- **Subject (person being evaluated)**: The person the feedback is about. MUST be selected from the canonical list only (no free-text); same source as the dashboard (e.g. evaluation data or maintained list) so that 360 data merges correctly and coach/org scoping works.
- **Rater**: The person submitting the form. Identified at least by role; optionally by identity for auditing. Used for access control and scoping.

## Assumptions

- The same five dimensions and four-level scale used today will be used for 360 feedback so that form data can be merged with existing evaluation data for distribution metrics.
- Rater roles are fixed to a small set (e.g. Coach, Product, Tech Lead, Team Member); no open-ended “other” required for MVP unless clarified.
- One submission per rater per subject per period (e.g. quarter); a new submission replaces the previous one for that rater-subject-period, supporting both single submissions per quarter and reevaluations (e.g. when the subject changes projects). Period for uniqueness = dashboard quarter; users can filter/view 360 data by quarter or by calendar month (year-month).
- Allowed subjects are derived from or aligned with the same canonical list used by the dashboard (e.g. people already in evaluation data or a maintained list) so that 360 data appears in the right coach/org scope.
- Anonymity policy: admins and coaches (for their scope) can see who submitted each 360 response (rater identity per submission); fully anonymous 360 can be a later refinement if needed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A rater can complete and submit the full form (select subject, role, five dimension scores, optional assertions) in under 5 minutes.
- **SC-002**: 100% of successfully submitted forms are recorded with correct subject, rater role, timestamp, and dimension scores and appear in the data used by the dashboard (or in a verified export) within 1 minute of submission.
- **SC-003**: Dashboard views that include 360 data show only distribution-based metrics (e.g. counts or percentages per level); no average score is displayed or used for 360 data.
- **SC-004**: Role-based scoping is preserved: coaches see only 360 data for their developers; admins see org-wide 360 data where applicable.
- **SC-005**: At least 90% of intended raters (by role) can access the form and submit without errors when they have a valid subject and period; any validation errors are clear and actionable.
