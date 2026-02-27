import { auth } from "@/lib/auth";
import { getCanonicalSubjectNames } from "@/lib/evaluations";
import { listFeedback360, submitFeedback360 } from "@/lib/feedback-360";
import { RATER_ROLES } from "@/lib/schema";
import type { RaterRole } from "@/lib/schema";
import { NextResponse } from "next/server";

function parseScore(v: unknown): 1 | 2 | 3 | 4 | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (Number.isInteger(n) && n >= 1 && n <= 4) return n as 1 | 2 | 3 | 4;
  return null;
}

export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; coachName?: string | null } | undefined;
  if (!session?.user || !user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "Admin" && user.role !== "Coach") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const quarter = searchParams.get("quarter") ?? undefined;
  const month = searchParams.get("month") ?? undefined;

  const options: { quarter?: string; month?: string; coachName?: string } = {};
  if (quarter) options.quarter = quarter;
  if (month) options.month = month;
  if (user.role === "Coach" && user.coachName) options.coachName = user.coachName;

  const submissions = listFeedback360(options);
  return NextResponse.json({ submissions });
}

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; role?: string } | undefined;
  if (!session?.user || !user?.id || !user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const subjectName = typeof o.subjectName === "string" ? o.subjectName : "";
  const raterRole = typeof o.raterRole === "string" ? o.raterRole : "";
  const techMastery = parseScore(o.techMastery);
  const buildTrust = parseScore(o.buildTrust);
  const resilientUnderPressure = parseScore(o.resilientUnderPressure);
  const teamPlayer = parseScore(o.teamPlayer);
  const moveFast = parseScore(o.moveFast);

  if (!subjectName.trim()) {
    return NextResponse.json({ error: "subjectName is required" }, { status: 400 });
  }
  if (!RATER_ROLES.includes(raterRole as RaterRole)) {
    return NextResponse.json({ error: `raterRole must be one of: ${RATER_ROLES.join(", ")}` }, { status: 400 });
  }
  if (techMastery === null || buildTrust === null || resilientUnderPressure === null || teamPlayer === null || moveFast === null) {
    return NextResponse.json({ error: "All five dimensions (techMastery, buildTrust, resilientUnderPressure, teamPlayer, moveFast) must be 1, 2, 3, or 4" }, { status: 400 });
  }

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
        techMasteryAssertions: typeof o.techMasteryAssertions === "string" ? o.techMasteryAssertions : undefined,
        buildTrustAssertions: typeof o.buildTrustAssertions === "string" ? o.buildTrustAssertions : undefined,
        resilientUnderPressureAssertions: typeof o.resilientUnderPressureAssertions === "string" ? o.resilientUnderPressureAssertions : undefined,
        teamPlayerAssertions: typeof o.teamPlayerAssertions === "string" ? o.teamPlayerAssertions : undefined,
        moveFastAssertions: typeof o.moveFastAssertions === "string" ? o.moveFastAssertions : undefined,
      },
      { raterId: user.id, raterName: user.name },
      { subjectAllowlist: subjects }
    );
    return NextResponse.json(
      { id: result.id, quarterKey: result.quarterKey, message: result.message },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
