import { redirect } from "next/navigation";
import Link from "next/link";
import { getDeveloperQuarterSnapshots, getQuartersSorted, getUniqueCoachNames } from "@/lib/evaluations";
import {
  getDistributionForSnapshots,
  getTrend,
  getRiskSummary,
} from "@/lib/aggregations";
import { computeDeveloperRisk, isAtRisk } from "@/lib/risk";
import { RiskBadges } from "@/components/RiskBadges";
import { ScoreBadge } from "@/components/ScoreBadge";
import { TrendArrow } from "@/components/TrendArrow";
import { CoachPortfolioHealth } from "./CoachPortfolioHealth";

export default async function CoachDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ coach?: string }>;
}) {
  const { coach: coachParam } = await searchParams;
  const coachNames = getUniqueCoachNames();
  const firstCoach = coachNames[0];
  if (!firstCoach) redirect("/dashboard/admin");
  const coachName = coachParam && coachNames.includes(coachParam) ? coachParam : firstCoach;
  if (!coachParam || !coachNames.includes(coachParam)) {
    redirect(`/dashboard/coach?coach=${encodeURIComponent(coachName)}`);
  }
  const snapshots = getDeveloperQuarterSnapshots({ coachName });
  const quarters = getQuartersSorted();
  const currentQuarterKey = quarters.length ? quarters[quarters.length - 1]!.quarterKey : "";
  const developers = Array.from(
    new Set(
      snapshots.filter((s) => s.quarterKey === currentQuarterKey).map((s) => s.consultantName)
    )
  ).sort();

  const rows: {
    consultantName: string;
    techMastery: number | null;
    buildTrust: number | null;
    resilientUnderPressure: number | null;
    teamPlayer: number | null;
    moveFast: number | null;
    trend: "up" | "down" | "flat";
    flags: ReturnType<typeof computeDeveloperRisk>;
  }[] = [];

  for (const name of developers) {
    const s = snapshots.find(
      (x) => x.consultantName === name && x.quarterKey === currentQuarterKey
    )!;
    const trend = getTrend(snapshots, coachName, name, currentQuarterKey);
    const flags = computeDeveloperRisk(snapshots, coachName, name);
    rows.push({
      consultantName: name,
      techMastery: s.techMastery,
      buildTrust: s.buildTrust,
      resilientUnderPressure: s.resilientUnderPressure,
      teamPlayer: s.teamPlayer,
      moveFast: s.moveFast,
      trend,
      flags,
    });
  }

  const dist = getDistributionForSnapshots(snapshots, currentQuarterKey);
  const riskSummary = getRiskSummary(snapshots, currentQuarterKey, { coachName });
  const prevQuarterKey = quarters.length >= 2 ? quarters[quarters.length - 2]!.quarterKey : null;
  const prevDist = prevQuarterKey
    ? getDistributionForSnapshots(snapshots, prevQuarterKey)
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900">My Developers</h1>

      <section>
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Developer</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Risk flags</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Scores</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Trend</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.consultantName} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-2 font-medium text-zinc-900">{r.consultantName}</td>
                  <td className="px-4 py-2">
                    <RiskBadges flags={r.flags} />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <ScoreBadge score={r.techMastery} />
                      <ScoreBadge score={r.buildTrust} />
                      <ScoreBadge score={r.resilientUnderPressure} />
                      <ScoreBadge score={r.teamPlayer} />
                      <ScoreBadge score={r.moveFast} />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <TrendArrow trend={r.trend} />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/coach/${encodeURIComponent(r.consultantName)}?coach=${encodeURIComponent(coachName)}`}
                      className="text-blue-600 hover:underline"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CoachPortfolioHealth
        distribution={dist}
        prevDistribution={prevDist}
        riskSummary={riskSummary}
        quarterLabel={quarters[quarters.length - 1]?.quarterLabel ?? ""}
        atRiskDevelopers={rows.filter((r) => isAtRisk(r.flags)).map((r) => r.consultantName)}
      />
    </div>
  );
}
