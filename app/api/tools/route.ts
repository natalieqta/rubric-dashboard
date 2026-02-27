import { NextResponse } from "next/server";
import toolsSchema from "@/docs/tools-schema.json";

/**
 * GET /api/tools — returns the tool schema for AI assistants (tool calling).
 * No auth required to read the schema; actual tool endpoints require session auth.
 */
export async function GET() {
  return NextResponse.json(toolsSchema);
}
