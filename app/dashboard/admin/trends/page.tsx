import { getDeveloperQuarterSnapshots, getQuartersSorted, getUniqueCoachNames, isHiddenCoach } from "@/lib/evaluations";
import { getDistributionForSnapshots, getSnapshotsOnePerDeveloper, getDeveloperAverageScoreByQuarter } from "@/lib/aggregations";
import { TrendsClient } from "./TrendsClient";

export default async function AdminTrendsPage() {
  const allSnapshots = getDeveloperQuarterSnapshots();
  const snapshots = allSnapshots.filter((s) => !isHiddenCoach(s.coachName));
  const quarters = getQuartersSorted();
  const coaches = getUniqueCoachNames();
  const developerMetrics = getDeveloperAverageScoreByQuarter(snapshots, quarters);
  const developerNames = [...new Set(developerMetrics.map((m) => m.consultantName))].sort();

  const orgDataByQuarter: Record<string, { pct1: number; pct2: number; pct3: number; pct4: number }[]> = {};
  const dimensionKeys = ["techMastery", "buildTrust", "resilientUnderPressure", "teamPlayer", "moveFast"] as const;
  for (const q of quarters) {
    const onePerDev = getSnapshotsOnePerDeveloper(snapshots, q.quarterKey);
    const dist = getDistributionForSnapshots(onePerDev, q.quarterKey);
    if (!orgDataByQuarter[q.quarterKey]) orgDataByQuarter[q.quarterKey] = [];
    for (const d of dist) {
      orgDataByQuarter[q.quarterKey].push({
        pct1: d.pct1,
        pct2: d.pct2,
        pct3: d.pct3,
        pct4: d.pct4,
      });
    }
  }

  const series = quarters.map((q) => {
    const dist = getDistributionForSnapshots(
      getSnapshotsOnePerDeveloper(snapshots, q.quarterKey),
      q.quarterKey
    );
    return {
      quarterKey: q.quarterKey,
      quarterLabel: q.quarterLabel,
      dimensions: dist,
    };
  });

  const coachSeries = coaches.map((coach) => ({
    coachName: coach,
    quarters: quarters.map((q) => {
      const coachSnapshots = snapshots.filter((s) => s.coachName === coach && s.quarterKey === q.quarterKey);
      const dist = getDistributionForSnapshots(
        snapshots.filter((s) => s.coachName === coach),
        q.quarterKey
      );
      return { quarterKey: q.quarterKey, quarterLabel: q.quarterLabel, dimensions: dist };
    }),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Developer trends</h1>
        <p className="mt-1 text-sm text-zinc-500">
          See who is improving (stars), who needs attention (risky), and quarter-over-quarter trends. Declined and flat lists use the latest quarter vs prior.
        </p>
      </div>
      <TrendsClient
        quarters={quarters}
        series={series}
        coachSeries={coachSeries}
        coaches={coaches}
        developerMetrics={developerMetrics}
        developerNames={developerNames}
      />
    </div>
  );
}
