# Tool calling: Rubric Dashboard API for AI assistants

The dashboard exposes **read-only tool endpoints** so an AI (e.g. Cursor, Claude, or a custom assistant) can answer questions like “What’s the risk for Scott’s portfolio?” or “How did Ruvi Raghavan do this quarter?” by calling your API.

## Endpoints

| Tool | Path | Query params | Description |
|------|------|--------------|-------------|
| **Risk summary** | `GET /api/tools/risk-summary` | `quarter` (optional), `coach` (optional) | Total developers, at-risk count, % at risk, breakdown by flag. Omit `coach` for org-wide; set `coach=Scott Rust` for that coach’s portfolio. |
| **Subject distribution** | `GET /api/tools/subject-distribution` | `subject` (required), `quarter` (optional) | One person’s scores per dimension (1–4) and risk flags for a quarter. |

**Auth:** Both endpoints require an authenticated session (same as the dashboard). Use the same origin and cookies (e.g. user is logged in in the browser, or your server sends the session cookie when calling from a backend).

## Get the tool schema (for the AI)

- **Schema URL:** `GET /api/tools`  
  Returns a JSON description of the tools (names, descriptions, parameters, paths). Use this so the AI knows what it can call.

- **Schema file:** `docs/tools-schema.json`  
  Same content; you can paste it into Cursor rules, a Claude project, or an OpenAI assistant.

## How to wire an AI to these tools

### Option A: Cursor / in-IDE agent

1. Tell the agent: “When the user asks about dashboard risk or a person’s scores, call the rubric dashboard tools.”
2. Give it the base URL (e.g. `http://localhost:3000` when running locally) and the fact that requests must include the user’s session (e.g. “assume the user is logged in and use their cookies” or use a dedicated API key if you add one later).
3. Point it at the schema: “Tool definitions are at GET /api/tools or in docs/tools-schema.json.”

### Option B: Claude / OpenAI function calling

1. Fetch `GET /api/tools` (or load `docs/tools-schema.json`).
2. Convert each item into a “function” tool: `name` = function name, `description` = function description, `parameters` = JSON schema for query params.
3. When the model wants to call a tool, perform a GET request to `{baseUrl}{path}?param1=value1&param2=value2` with auth (e.g. cookie or API key header).
4. Pass the JSON response back to the model so it can summarize for the user.

### Option C: Simple “ask the dashboard” script

```bash
# Risk summary (org-wide, latest quarter)
curl -b "your-session-cookie.txt" "http://localhost:3000/api/tools/risk-summary"

# Risk for a coach
curl -b "your-session-cookie.txt" "http://localhost:3000/api/tools/risk-summary?coach=Scott%20Rust"

# One person’s distribution
curl -b "your-session-cookie.txt" "http://localhost:3000/api/tools/subject-distribution?subject=Ruvi%20Raghavan"
```

## Example responses

**GET /api/tools/risk-summary**
```json
{
  "quarterKey": "2025-Q2",
  "quarterLabel": "Q2 2025",
  "scope": "org",
  "totalDevelopers": 42,
  "atRiskCount": 5,
  "pctAtRisk": 11.9,
  "byFlag": { "lowScore": 2, "declining": 1, "stagnant": 2, "dataGap": 0 }
}
```

**GET /api/tools/subject-distribution?subject=Ruvi Raghavan**
```json
{
  "subjectName": "Ruvi Raghavan",
  "coachName": "Scott Rust",
  "quarterKey": "2025-Q2",
  "quarterLabel": "Q2 2025",
  "found": true,
  "dimensions": {
    "techMastery": { "level": 3, "label": "Tech Mastery", "scoreLabel": "Meets Expectations" },
    ...
  },
  "atRisk": false,
  "riskFlags": null
}
```

All metrics are **distribution-based** (no averages in the dashboard); these tools expose the same data the UI uses.
