import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDeveloperQuarterSnapshots, getQuartersSorted, isHiddenCoach } from "@/lib/evaluations";
import { getDistributionForSnapshots, getRiskSummary } from "@/lib/aggregations";
import { DIMENSION_LABELS } from "@/lib/schema";
import { computeDeveloperRisk, isAtRisk } from "@/lib/risk";
import { RiskBadges } from "@/components/RiskBadges";
import { ScoreBadge } from "@/components/ScoreBadge";

export default async function CoachPortfolioPage({
  params,
}: {
  params: Promise<{ coachName: string }>;
}) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "Admin") redirect("/login");

  const { coachName } = await params;
  const decoded = decodeURIComponent(coachName);
  if (isHiddenCoach(decoded)) redirect("/dashboard/admin/coaches");
  const snapshots = getDeveloperQuarterSnapshots();
  const quarters = getQuartersSorted();
  const currentQuarterKey = quarters.length ? quarters[quarters.length - 1]!.quarterKey : "";
  const coachSnapshots = snapshots.filter((s) => s.coachName === decoded && s.quarterKey === currentQuarterKey);
  const developers = Array.from(new Set(coachSnapshots.map((s) => s.consultantName))).sort();
  const dist = getDistributionForSnapshots(snapshots.filter((s) => s.coachName === decoded), currentQuarterKey);
  const risk = getRiskSummary(snapshots, currentQuarterKey, { coachName: decoded });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/coaches" className="text-sm text-blue-600 hover:underline">
          ← Coaches
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-900">{decoded}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Developers</p>
          <p className="text-xl font-semibold">{developers.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">At risk</p>
          <p className="text-xl font-semibold">{risk.atRiskCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">% at risk</p>
          <p className="text-xl font-semibold">{risk.pctAtRisk.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Quarter</p>
          <p className="text-xl font-semibold">{quarters[quarters.length - 1]?.quarterLabel ?? "—"}</p>
        </div>
      </div>
      <section>
        <h2 className="mb-2 text-lg font-medium text-zinc-900">Distribution (% at level)</h2>
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-2 text-left font-medium text-zinc-700">Dimension</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">L1 %</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">L2 %</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">L3 %</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-700">L4 %</th>
              </tr>
            </thead>
            <tbody>
              {dist.map((d) => (
                <tr key={d.dimension} className="border-b border-zinc-100">
                  <td className="px-4 py-2 font-medium text-zinc-900">{DIMENSION_LABELS[d.dimension]}</td>
                  <td className="px-4 py-2 text-right">{d.pct1.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{d.pct2.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{d.pct3.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{d.pct4.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-medium text-zinc-900">Developers</h2>
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Developer</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Risk flags</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700">Scores</th>
              </tr>
            </thead>
            <tbody>
              {developers.map((name) => {
                const s = coachSnapshots.find((x) => x.consultantName === name)!;
                const flags = computeDeveloperRisk(snapshots, decoded, name);
                return (
                  <tr key={name} className="border-b border-zinc-100">
                    <td className="px-4 py-2 font-medium text-zinc-900">{name}</td>
                    <td className="px-4 py-2">
                      <RiskBadges flags={flags} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <ScoreBadge score={s.techMastery} />
                        <ScoreBadge score={s.buildTrust} />
                        <ScoreBadge score={s.resilientUnderPressure} />
                        <ScoreBadge score={s.teamPlayer} />
                        <ScoreBadge score={s.moveFast} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
