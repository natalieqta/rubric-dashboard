"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DimensionDistribution } from "@/lib/aggregations";
import type { DimensionKey } from "@/lib/schema";
import { DIMENSION_LABELS } from "@/lib/schema";

const LEVEL_COLORS = ["#dc2626", "#d97706", "#2563eb", "#16a34a"];

interface OrgOverviewClientProps {
  quarters: { quarterKey: string; quarterLabel: string }[];
  currentQuarterKey: string;
  distribution: DimensionDistribution[];
  prevDistribution: DimensionDistribution[];
  weakestDimension: DimensionKey;
  riskSummary: {
    totalDevelopers: number;
    atRiskCount: number;
    pctAtRisk: number;
    byFlag: { lowScore: number; declining: number; stagnant: number; dataGap: number };
  };
}

export function OrgOverviewClient({
  quarters,
  currentQuarterKey,
  distribution,
  prevDistribution,
  weakestDimension,
  riskSummary,
}: OrgOverviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setQuarter(quarterKey: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("quarter", quarterKey);
    router.push(`/dashboard/admin?${next.toString()}`);
  }

  const chartData = distribution.map((d) => ({
    name: DIMENSION_LABELS[d.dimension],
    key: d.dimension,
    L1: d.counts[1],
    L2: d.counts[2],
    L3: d.counts[3],
    L4: d.counts[4],
    pct1: d.pct1.toFixed(1),
    pct2: d.pct2.toFixed(1),
    pct3: d.pct3.toFixed(1),
    pct4: d.pct4.toFixed(1),
  }));

  const prevMap = new Map(prevDistribution.map((d) => [d.dimension, d]));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-zinc-700">Quarter</label>
        <select
          value={currentQuarterKey}
          onChange={(e) => setQuarter(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          {quarters.map((q) => (
            <option key={q.quarterKey} value={q.quarterKey}>
              {q.quarterLabel}
            </option>
          ))}
        </select>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Risk Summary</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Total developers</p>
            <p className="text-2xl font-semibold text-zinc-900">{riskSummary.totalDevelopers}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">At risk</p>
            <p className="text-2xl font-semibold text-zinc-900">{riskSummary.atRiskCount}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">% at risk</p>
            <p className="text-2xl font-semibold text-zinc-900">
              {riskSummary.pctAtRisk.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">By flag</p>
            <p className="text-sm text-zinc-700">
              Low: {riskSummary.byFlag.lowScore} · Declining: {riskSummary.byFlag.declining} ·
              Stagnant: {riskSummary.byFlag.stagnant} · Data gap: {riskSummary.byFlag.dataGap}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Score distribution (count by level)</h2>
        <p className="mb-2 text-sm text-amber-700">
          Weakest area (highest L1–L2): <strong>{DIMENSION_LABELS[weakestDimension]}</strong>
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [String(value ?? 0), name ?? ""]}
                labelFormatter={(label) => `Dimension: ${label}`}
              />
              <Legend />
              <Bar dataKey="L1" name="L1 (Below)" stackId="a" fill={LEVEL_COLORS[0]} />
              <Bar dataKey="L2" name="L2 (Progressing)" stackId="a" fill={LEVEL_COLORS[1]} />
              <Bar dataKey="L3" name="L3 (Meets)" stackId="a" fill={LEVEL_COLORS[2]} />
              <Bar dataKey="L4" name="L4 (Exceeds)" stackId="a" fill={LEVEL_COLORS[3]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Distribution % vs previous quarter</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="py-2 text-left font-medium text-zinc-700">Dimension</th>
                <th className="py-2 text-right font-medium text-zinc-700">L1 %</th>
                <th className="py-2 text-right font-medium text-zinc-700">L2 %</th>
                <th className="py-2 text-right font-medium text-zinc-700">L3 %</th>
                <th className="py-2 text-right font-medium text-zinc-700">L4 %</th>
                <th className="py-2 text-right font-medium text-zinc-700">Shift vs prev</th>
              </tr>
            </thead>
            <tbody>
              {distribution.map((d) => {
                const prev = prevMap.get(d.dimension);
                const shift = prev
                  ? `L3: ${(d.pct3 - prev.pct3).toFixed(1)}pp, L4: ${(d.pct4 - prev.pct4).toFixed(1)}pp`
                  : "—";
                return (
                  <tr key={d.dimension} className="border-b border-zinc-100">
                    <td className="py-2 font-medium text-zinc-900">
                      {DIMENSION_LABELS[d.dimension]}
                      {d.dimension === weakestDimension && (
                        <span className="ml-1 text-amber-600">(weakest)</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-zinc-700">{d.pct1.toFixed(1)}%</td>
                    <td className="py-2 text-right text-zinc-700">{d.pct2.toFixed(1)}%</td>
                    <td className="py-2 text-right text-zinc-700">{d.pct3.toFixed(1)}%</td>
                    <td className="py-2 text-right text-zinc-700">{d.pct4.toFixed(1)}%</td>
                    <td className="py-2 text-right text-zinc-600">{shift}</td>
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
