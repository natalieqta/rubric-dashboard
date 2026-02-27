/**
 * Server-only: fetch evaluation rows from Google Sheets.
 * Used by app/api/evaluations/route.ts and lib/evaluations.ts.
 */

import { google } from "googleapis";
import type { RawEvaluationRow } from "./parse";

const SPREADSHEET_ID = "1w4GXaiuWC5l8rIhX7wmdeeu-H-i6l6s2J2qaP4Dmv4g";
const SHEET_GID = 837944858;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY. Set them in .env or Vercel."
    );
  }
  const privateKey = key.replace(/\\n/g, "\n");
  return new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * Fetch raw evaluation rows from the configured Google Sheet.
 * First row of the sheet is treated as headers; each subsequent row becomes an object keyed by header.
 * Returns the same shape as the former data/evaluations.json (array of raw row objects).
 */
export async function getRawEvaluationsFromSheet(): Promise<RawEvaluationRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: "sheets(properties(sheetId,title))",
  });

  const sheet = res.data.sheets?.find(
    (s) => s.properties?.sheetId === SHEET_GID
  );
  const title = sheet?.properties?.title;
  if (!title) {
    throw new Error(
      `Sheet with gid ${SHEET_GID} not found in spreadsheet ${SPREADSHEET_ID}`
    );
  }

  const valueRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${title}'!A:Z`,
  });

  const rows = valueRes.data.values as string[][] | undefined;
  if (!rows || rows.length < 2) {
    return [];
  }

  const headers = rows[0]!.map((h) => String(h ?? "").trim());
  const raw: RawEvaluationRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i] ?? [];
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      if (key) obj[key] = values[j] ?? "";
    }
    raw.push(obj as RawEvaluationRow);
  }

  return raw;
}
