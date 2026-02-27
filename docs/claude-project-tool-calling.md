# Claude project: Rubric Dashboard tool calling

Paste the section below into your Claude project's **Instructions** or **Custom instructions** (or add as a knowledge file) so Claude knows how to answer questions using the dashboard API.

---

## Instructions to paste into Claude

```markdown
When the user asks about the rubric dashboard—e.g. risk, at-risk developers, a coach's portfolio, or how a specific person (consultant) performed—use the read-only dashboard tools.

**Base URL:** Use the app origin. For local dev: `http://localhost:3000`. In production: the deployed URL (e.g. `https://your-app.vercel.app`).

**Auth:** These tools require the same session as the dashboard. If the user is asking in a context where they're logged in (e.g. same browser/session), include credentials. If you're in a headless or API context, the user must provide an API key or session cookie if the app supports it.

**Available tools:**

1. **Risk summary** — GET `{baseUrl}/api/tools/risk-summary`
   - Query params: `quarter` (optional, e.g. 2025-Q2), `coach` (optional, e.g. Scott Rust). Omit both for org-wide latest quarter.
   - Use for: "How many are at risk?", "What's Scott's portfolio risk?", "Org risk this quarter?"

2. **Subject distribution** — GET `{baseUrl}/api/tools/subject-distribution`
   - Query params: `subject` (required, full name e.g. Ruvi Raghavan), `quarter` (optional).
   - Use for: "How did [name] do?", "What are [name]'s scores?", "Is [name] at risk?"

**Schema:** You can fetch the full tool list and parameter descriptions from GET `{baseUrl}/api/tools` (JSON). When the user asks a dashboard question, call the appropriate tool, then summarize the JSON response in plain language. Do not make up numbers; only use what the tool returns.
```

---

## Optional: add the schema as project knowledge

If your Claude project supports **knowledge** or **project files**, you can add:

- **File:** `docs/tools-schema.json` — so Claude can read tool names, descriptions, and parameters.
- **File:** `docs/tool-calling.md` — full doc with examples and curl commands.

Then in instructions add: "Tool definitions are in project knowledge: tools-schema.json and tool-calling.md."

---

## Quick test

Once the instructions are in place, try:

- "What's the org risk summary for the latest quarter?"
- "How did Ruvi Raghavan do this quarter?" (use a real name from your data)
- "What's the risk for [coach name]'s portfolio?"

Claude should propose calling the right tool and summarize the response. If your app is not reachable from where Claude runs (e.g. localhost), use your deployed URL or a tunnel (e.g. ngrok) for testing.
