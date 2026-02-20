import { getDeveloperQuarterSnapshots, getQuartersSorted } from "@/lib/evaluations";
import {
  getDistributionForSnapshots,
  getSnapshotsOnePerDeveloper,
  getRiskSummaryOrg,
  type DimensionDistribution,
} from "@/lib/aggregations";
import type { DimensionKey } from "@/lib/schema";
import { Suspense } from "react";
import { OrgOverviewClient } from "./OrgOverviewClient";

export default async function AdminOrgOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ quarter?: string }>;
}) {
  const { quarter: quarterParam } = await searchParams;
  const snapshots = getDeveloperQuarterSnapshots();
  const quarters = getQuartersSorted();
  const defaultQuarter = quarters.length ? quarters[quarters.length - 1]!.quarterKey : null;
  const quarterKey = quarterParam && quarters.some((q) => q.quarterKey === quarterParam) ? quarterParam : (defaultQuarter ?? "");

  const onePerDev = getSnapshotsOnePerDeveloper(snapshots, quarterKey);
  const distribution = getDistributionForSnapshots(onePerDev, quarterKey);
  const riskSummary = getRiskSummaryOrg(snapshots, quarterKey);

  const prevQuarterKey =
    quarters.length >= 2 ? quarters[quarters.length - 2]!.quarterKey : null;
  let prevDistribution: DimensionDistribution[] = [];
  if (prevQuarterKey) {
    const prevOnePerDev = getSnapshotsOnePerDeveloper(snapshots, prevQuarterKey);
    prevDistribution = getDistributionForSnapshots(prevOnePerDev, prevQuarterKey);
  }

  const weakestDim = distribution.reduce<{ dim: DimensionKey; pct: number }>(
    (acc, d) => {
      const pctLow = d.pct1 + d.pct2;
      return pctLow > acc.pct ? { dim: d.dimension, pct: pctLow } : acc;
    },
    { dim: distribution[0]?.dimension ?? "techMastery", pct: 0 }
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Org Overview</h1>

      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <OrgOverviewClient
          quarters={quarters}
          currentQuarterKey={quarterKey}
          distribution={distribution}
          prevDistribution={prevDistribution}
          weakestDimension={weakestDim.dim}
          riskSummary={riskSummary}
        />
      </Suspense>
    </div>
  );
}
