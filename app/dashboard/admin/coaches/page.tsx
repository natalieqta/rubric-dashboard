import Link from "next/link";
import { getDeveloperQuarterSnapshots, getQuartersSorted, getUniqueCoachNames } from "@/lib/evaluations";
import {
  getDistributionForSnapshots,
  getImprovedDeclinedFlat,
  getRiskSummary,
  getSnapshotsOnePerDeveloper,
} from "@/lib/aggregations";
import { DIMENSION_LABELS } from "@/lib/schema";

export default async function AdminCoachesPage() {
  const snapshots = getDeveloperQuarterSnapshots();
  const quarters = getQuartersSorted();
  const currentQuarterKey = quarters.length ? quarters[quarters.length - 1]!.quarterKey : "";
  const coaches = getUniqueCoachNames();

  const rows: {
    coachName: string;
    developerCount: number;
    pctL1L2: number;
    pctL3L4: number;
    atRisk: number;
    improved: number;
    declined: number;
    flat: number;
    flagOver30: boolean;
  }[] = [];

  for (const coachName of coaches) {
    const coachSnapshots = snapshots.filter((s) => s.coachName === coachName && s.quarterKey === currentQuarterKey);
    const developerCount = new Set(coachSnapshots.map((s) => s.consultantName)).size;
    const dist = getDistributionForSnapshots(
      snapshots.filter((s) => s.coachName === coachName),
      currentQuarterKey
    );
    const pctL1L2 = dist.reduce((sum, d) => sum + d.pct1 + d.pct2, 0) / 5;
    const pctL3L4 = dist.reduce((sum, d) => sum + d.pct3 + d.pct4, 0) / 5;
    const risk = getRiskSummary(snapshots, currentQuarterKey, { coachName });
    const idf = getImprovedDeclinedFlat(snapshots, coachName, currentQuarterKey);
    rows.push({
      coachName,
      developerCount: risk.totalDevelopers,
      pctL1L2,
      pctL3L4,
      atRisk: risk.atRiskCount,
      improved: idf.improved,
      declined: idf.declined,
      flat: idf.flat,
      flagOver30: risk.totalDevelopers > 0 && risk.pctAtRisk > 30,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Coach Effectiveness</h1>
      <p className="text-sm text-zinc-600">
        Current quarter: {quarters[quarters.length - 1]?.quarterLabel ?? "—"}
      </p>
      <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Coach</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700"># Developers</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700">% L1–L2</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700">% L3–L4</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700"># At risk</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700"># Improved</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700"># Declined</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700"># Flat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.coachName} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/admin/coaches/${encodeURIComponent(r.coachName)}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {r.coachName}
                  </Link>
                  {r.flagOver30 && (
                    <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      &gt;30% at risk
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-right text-zinc-700">{r.developerCount}</td>
                <td className="px-4 py-2 text-right text-zinc-700">{r.pctL1L2.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right text-zinc-700">{r.pctL3L4.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right text-zinc-700">{r.atRisk}</td>
                <td className="px-4 py-2 text-right text-green-700">{r.improved}</td>
                <td className="px-4 py-2 text-right text-red-700">{r.declined}</td>
                <td className="px-4 py-2 text-right text-zinc-600">{r.flat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
