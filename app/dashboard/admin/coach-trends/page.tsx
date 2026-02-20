import {
  getDeveloperQuarterSnapshots,
  getQuartersSorted,
  isHiddenCoach,
} from "@/lib/evaluations";
import {
  getCoachAverageScoreByQuarter,
  getCoachLatestVsPrior,
} from "@/lib/aggregations";
import { CoachTrendsClient } from "./CoachTrendsClient";

export default async function CoachTrendsPage() {
  const snapshots = getDeveloperQuarterSnapshots();
  const quarters = getQuartersSorted();
  const allMetrics = getCoachAverageScoreByQuarter(snapshots, quarters);
  const metrics = allMetrics.filter((m) => !isHiddenCoach(m.coachName));

  const quarterLabels = quarters.map((q) => q.quarterLabel);
  const latest = quarters[quarters.length - 1];
  const prior = quarters.length >= 2 ? quarters[quarters.length - 2] : latest;
  const allLatestVsPrior = latest
    ? getCoachLatestVsPrior(allMetrics, latest.quarterKey, prior?.quarterKey ?? latest.quarterKey)
    : [];
  const latestVsPrior = allLatestVsPrior.filter((row) => !isHiddenCoach(row.coachName));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Coach trends
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Data from <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">data/evaluations.json</code>
        </p>
      </div>
      <CoachTrendsClient
        metrics={metrics}
        latestVsPrior={latestVsPrior}
        quarterLabels={quarterLabels}
        latestQuarterLabel={latest?.quarterLabel ?? "—"}
        priorQuarterLabel={prior?.quarterLabel ?? "—"}
      />
    </div>
  );
}
