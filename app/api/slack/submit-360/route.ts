import { createHmac, timingSafeEqual } from "crypto";
import { getCanonicalSubjectNames } from "@/lib/evaluations";
import { submitFeedback360 } from "@/lib/feedback-360";
import { RATER_ROLES } from "@/lib/schema";
import type { RaterRole } from "@/lib/schema";
import { NextResponse } from "next/server";

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const MAX_AGE_SEC = 60 * 5; // 5 minutes

function verifySlackRequest(rawBody: string, signature: string | null, timestamp: string | null): boolean {
  if (!SLACK_SIGNING_SECRET || !signature?.startsWith("v0=") || !timestamp) return false;
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (Number.isNaN(age) || age > MAX_AGE_SEC) return false;
  const base = `v0:${timestamp}:${rawBody}`;
  const expected = "v0=" + createHmac("sha256", SLACK_SIGNING_SECRET).update(base).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Parse slash command text into subject, raterRole, and 5 scores.
 * Expected format: "Subject Name" Role n n n n n  (e.g. "Jane Doe" Coach 3 3 4 3 2)
 */
function parseSlackText(text: string): { subjectName: string; raterRole: string; scores: [number, number, number, number, number] } | null {
  const tokens = text.trim().split(/\s+/);
  if (tokens.length < 7) return null;
  const last5 = tokens.slice(-5);
  const roleToken = tokens[tokens.length - 6];
  const subjectParts = tokens.slice(0, tokens.length - 6);
  if (!RATER_ROLES.includes(roleToken as RaterRole)) return null;
  const scores: number[] = [];
  for (const s of last5) {
    const n = parseInt(s, 10);
    if (!Number.isInteger(n) || n < 1 || n > 4) return null;
    scores.push(n);
  }
  return {
    subjectName: subjectParts.join(" "),
    raterRole: roleToken,
    scores: scores as [number, number, number, number, number],
  };
}

export async function POST(req: Request) {
  if (!SLACK_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "Slack integration not configured (SLACK_SIGNING_SECRET)" },
      { status: 503 }
    );
  }

  const signature = req.headers.get("x-slack-signature");
  const timestamp = req.headers.get("x-slack-request-timestamp");
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!verifySlackRequest(rawBody, signature, timestamp)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const userId = params.get("user_id") ?? "";
  const userName = params.get("user_name") ?? params.get("user_id") ?? "Slack User";
  const text = params.get("text")?.trim() ?? "";

  const parsed = parseSlackText(text);
  if (!parsed) {
    return new NextResponse(
      JSON.stringify({
        response_type: "ephemeral",
        text: "Usage: /360 \"Subject Full Name\" <Role> <5 scores 1-4>\nExample: /360 \"Jane Doe\" Coach 3 3 4 3 2\nRoles: Coach, Product, Tech Lead, Team Member",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { subjectName, raterRole, scores } = parsed;
  const [techMastery, buildTrust, resilientUnderPressure, teamPlayer, moveFast] = scores;

  try {
    const subjects = await getCanonicalSubjectNames();
    const result = submitFeedback360(
      {
        subjectName,
        raterRole,
        techMastery,
        buildTrust,
        resilientUnderPressure,
        teamPlayer,
        moveFast,
      },
      { raterId: `slack:${userId}`, raterName: userName },
      { subjectAllowlist: subjects }
    );
    return new NextResponse(
      JSON.stringify({
        response_type: "ephemeral",
        text: `360 feedback recorded for *${subjectName}* (${result.quarterKey}). ${result.message}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return new NextResponse(
      JSON.stringify({
        response_type: "ephemeral",
        text: `Error: ${message}`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
