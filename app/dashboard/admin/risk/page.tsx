import { getDeveloperQuarterSnapshots, getQuartersSorted, getUniqueCoachNames, isHiddenCoach } from "@/lib/evaluations";
import { getSnapshotsOnePerDeveloper } from "@/lib/aggregations";
import { computeDeveloperRisk, isAtRisk, getDeveloperTimeline } from "@/lib/risk";
import { getTrend } from "@/lib/aggregations";
import { RiskTable } from "./RiskTable";
import type { DeveloperQuarterSnapshot } from "@/lib/schema";

export default async function AdminRiskPage() {
  const snapshots = getDeveloperQuarterSnapshots();
  const quarters = getQuartersSorted();
  const currentQuarterKey = quarters.length ? quarters[quarters.length - 1]!.quarterKey : "";
  const onePerDev = getSnapshotsOnePerDeveloper(snapshots, currentQuarterKey);

  const atRiskRows: {
    consultantName: string;
    coachName: string;
    quarterKey: string;
    quarterLabel: string;
    flags: ReturnType<typeof computeDeveloperRisk>;
    techMastery: number | null;
    buildTrust: number | null;
    resilientUnderPressure: number | null;
    teamPlayer: number | null;
    moveFast: number | null;
    trend: "up" | "down" | "flat";
    history: DeveloperQuarterSnapshot[];
  }[] = [];

  for (const s of onePerDev) {
    if (isHiddenCoach(s.coachName)) continue;
    const flags = computeDeveloperRisk(snapshots, s.coachName, s.consultantName);
    if (!isAtRisk(flags)) continue;
    const trend = getTrend(snapshots, s.coachName, s.consultantName, currentQuarterKey);
    const timeline = getDeveloperTimeline(snapshots, s.coachName, s.consultantName);
    const history = Array.from(timeline.keys())
      .sort()
      .map((k) => timeline.get(k)!);
    atRiskRows.push({
      consultantName: s.consultantName,
      coachName: s.coachName,
      quarterKey: s.quarterKey,
      quarterLabel: s.quarterLabel,
      flags,
      techMastery: s.techMastery,
      buildTrust: s.buildTrust,
      resilientUnderPressure: s.resilientUnderPressure,
      teamPlayer: s.teamPlayer,
      moveFast: s.moveFast,
      trend,
      history,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Risk Dashboard</h1>
      <RiskTable
        rows={atRiskRows}
        quarters={quarters}
        coaches={getUniqueCoachNames()}
      />
    </div>
  );
}
