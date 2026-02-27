import { getRawEvaluationsFromSheet } from "@/lib/evaluations-sheet";
import { NextResponse } from "next/server";

/**
 * GET /api/evaluations
 * Returns raw evaluation rows from Google Sheets in the same JSON structure as data/evaluations.json.
 */
export async function GET() {
  try {
    const data = await getRawEvaluationsFromSheet();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load evaluations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
