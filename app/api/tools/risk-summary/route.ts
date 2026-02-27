import { auth } from "@/lib/auth";
import { getMergedRecordsForDashboard, getQuartersSorted } from "@/lib/evaluations";
import { getRiskSummary, getRiskSummaryOrg } from "@/lib/aggregations";
import { NextResponse } from "next/server";

/**
 * Tool-callable endpoint: risk summary for the rubric dashboard.
 * GET /api/tools/risk-summary?quarter=2025-Q2&coach=Scott Rust
 * - quarter: optional; defaults to latest quarter
 * - coach: optional; if provided, summary for that coach's portfolio only (Admin or that Coach)
 * Requires auth. Admin can pass any coach; Coach can only request their own coachName.
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
  const quarterParam = searchParams.get("quarter") ?? undefined;
  const coachParam = searchParams.get("coach") ?? undefined;

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
    return NextResponse.json({
      error: "No quarter data available",
      quarters: quarters.map((q) => q.quarterKey),
    }, { status: 400 });
  }

  if (user.role === "Coach") {
    const coachName = user.coachName ?? "";
    const risk = getRiskSummary(snapshots, quarterKey, { coachName });
    const quarterLabel = quarters.find((q) => q.quarterKey === quarterKey)?.quarterLabel ?? quarterKey;
    return NextResponse.json({
      quarterKey,
      quarterLabel,
      coachName,
      scope: "coach",
      totalDevelopers: risk.totalDevelopers,
      atRiskCount: risk.atRiskCount,
      pctAtRisk: Math.round(risk.pctAtRisk * 10) / 10,
      byFlag: risk.byFlag,
    });
  }

  if (coachParam) {
    const risk = getRiskSummary(snapshots, quarterKey, { coachName: coachParam });
    const quarterLabel = quarters.find((q) => q.quarterKey === quarterKey)?.quarterLabel ?? quarterKey;
    return NextResponse.json({
      quarterKey,
      quarterLabel,
      coachName: coachParam,
      scope: "coach",
      totalDevelopers: risk.totalDevelopers,
      atRiskCount: risk.atRiskCount,
      pctAtRisk: Math.round(risk.pctAtRisk * 10) / 10,
      byFlag: risk.byFlag,
    });
  }

  const risk = getRiskSummaryOrg(snapshots, quarterKey);
  const quarterLabel = quarters.find((q) => q.quarterKey === quarterKey)?.quarterLabel ?? quarterKey;
  return NextResponse.json({
    quarterKey,
    quarterLabel,
    scope: "org",
    totalDevelopers: risk.totalDevelopers,
    atRiskCount: risk.atRiskCount,
    pctAtRisk: Math.round(risk.pctAtRisk * 10) / 10,
    byFlag: risk.byFlag,
  });
}
