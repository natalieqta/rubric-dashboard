# Slack “Submit 360” slash command

Submit 360° feedback from Slack with a slash command. Data is stored in the same place as the web form (`data/feedback-360.json`) and appears in the dashboard.

## Setup

1. **Create a Slack app** (or use an existing one): [api.slack.com/apps](https://api.slack.com/apps) → Create New App → From scratch.

2. **Enable a slash command**  
   - Slash Commands → Create New Command  
   - Command: `/360`  
   - Request URL: `https://<your-dashboard-host>/api/slack/submit-360`  
   - Short description: e.g. `Submit 360 feedback for a person`  
   - Save.

3. **Signing secret**  
   - Basic Information → App Credentials → Signing Secret → Copy.

4. **Environment**  
   Set in your app (e.g. `.env.local` or deployment env):

   ```bash
   SLACK_SIGNING_SECRET=<your-signing-secret>
   ```

5. **Install the app** to your workspace (OAuth & Permissions → Install to Workspace) so people can use `/360`.

## Usage

In any channel or DM:

```text
/360 Subject Full Name Coach 3 3 4 3 2
```

- **Subject** = person being evaluated (must match the canonical list from the dashboard; multiple words are allowed).
- **Role** = one of: `Coach`, `Product`, `Tech Lead`, `Team Member`.
- **Five numbers** = scores 1–4 for: Tech Mastery, Build Trust, Resilient Under Pressure, Team Player, Move Fast.

Example:

```text
/360 Jane Doe Coach 3 3 4 3 2
```

The bot replies only to the person who ran the command (ephemeral). If the subject isn’t in the canonical list or the format is wrong, you get an error and a usage reminder.

## Endpoint

- **POST** `/api/slack/submit-360`  
  - Body: `application/x-www-form-urlencoded` (Slack’s default for slash commands).  
  - Auth: verified via `X-Slack-Signature` using `SLACK_SIGNING_SECRET`.  
  - Response: always **200** with JSON `{ "response_type": "ephemeral", "text": "..." }` so Slack shows the message only to the user.

## Notes

- Rater identity is stored as `slack:<user_id>` and the Slack display name so admins/coaches can see who submitted in the dashboard.
- Same one-submission-per-(rater, subject, quarter) rule as the web form; resubmitting replaces the previous submission for that quarter.
