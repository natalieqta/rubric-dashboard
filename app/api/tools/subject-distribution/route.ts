import { auth } from "@/lib/auth";
import {
  getMergedRecordsForDashboard,
  getQuartersSorted,
  getCanonicalSubjectNames,
} from "@/lib/evaluations";
import { getSnapshotsOnePerDeveloper } from "@/lib/aggregations";
import { computeDeveloperRisk, isAtRisk } from "@/lib/risk";
import { DIMENSION_LABELS, SCORE_LABELS } from "@/lib/schema";
import type { DimensionKey } from "@/lib/schema";
import { NextResponse } from "next/server";

/**
 * Tool-callable endpoint: distribution (scores by dimension) for one subject in a quarter.
 * GET /api/tools/subject-distribution?subject=Ruvi Raghavan&quarter=2025-Q2
 * Returns latest evaluation + 360 data for that person in that quarter; distribution-only (no average).
 * Requires auth. Coach can only query subjects who are their developers.
 */
export async function GET(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string; coachName?: string | null } | undefined;
  if (!session?.user || !user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "Admin" && user.role !== "Coach") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const subjectParam = searchParams.get("subject")?.trim();
  const quarterParam = searchParams.get("quarter") ?? undefined;

  if (!subjectParam) {
    return NextResponse.json(
      { error: "Missing query parameter: subject (consultant name)" },
      { status: 400 }
    );
  }

  const snapshots = await getMergedRecordsForDashboard(
    user.role === "Coach" && user.coachName ? { coachName: user.coachName } : undefined
  );
  const quarters = await getQuartersSorted();
  const defaultQuarterKey = quarters.length ? quarters[quarters.length - 1]!.quarterKey : null;
  const quarterKey =
    quarterParam && quarters.some((q) => q.quarterKey === quarterParam)
      ? quarterParam
      : (defaultQuarterKey ?? "");

  if (!quarterKey) {
    return NextResponse.json(
      { error: "No quarter data available", quarters: quarters.map((q) => q.quarterKey) },
      { status: 400 }
    );
  }

  const canonical = await getCanonicalSubjectNames();
  const subjectMatch = canonical.find(
    (n) => n.toLowerCase() === subjectParam.toLowerCase()
  );
  const subjectName = subjectMatch ?? subjectParam;

  const onePerDev = getSnapshotsOnePerDeveloper(snapshots, quarterKey);
  const snapshot = onePerDev.find(
    (s) => s.consultantName.toLowerCase() === subjectName.toLowerCase()
  );

  if (!snapshot) {
    return NextResponse.json({
      subjectName: subjectParam,
      quarterKey,
      quarterLabel: quarters.find((q) => q.quarterKey === quarterKey)?.quarterLabel ?? quarterKey,
      found: false,
      message: "No evaluation or 360 data for this subject in this quarter. Use exact consultant name as in the dashboard.",
    });
  }

  const dimensions: Record<string, { level: number; label: string; scoreLabel: string }> = {};
  const dimKeys: DimensionKey[] = [
    "techMastery",
    "buildTrust",
    "resilientUnderPressure",
    "teamPlayer",
    "moveFast",
  ];
  for (const dim of dimKeys) {
    const v = snapshot[dim];
    const level = v ?? 0;
    dimensions[dim] = {
      level: level as number,
      label: DIMENSION_LABELS[dim],
      scoreLabel: v != null && v >= 1 && v <= 4 ? SCORE_LABELS[v as 1 | 2 | 3 | 4] : "No data",
    };
  }

  const flags = computeDeveloperRisk(
    snapshots,
    snapshot.coachName,
    snapshot.consultantName
  );
  const atRisk = isAtRisk(flags);

  const quarterLabel = quarters.find((q) => q.quarterKey === quarterKey)?.quarterLabel ?? quarterKey;

  return NextResponse.json({
    subjectName: snapshot.consultantName,
    coachName: snapshot.coachName,
    quarterKey,
    quarterLabel,
    found: true,
    dimensions,
    atRisk,
    riskFlags: atRisk
      ? {
          lowScore: flags.lowScore ?? [],
          declining: flags.declining ?? [],
          stagnant: flags.stagnant ?? [],
          dataGap: flags.dataGap ?? [],
        }
      : null,
  });
}
