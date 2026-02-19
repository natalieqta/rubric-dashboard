"use client";

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
import { DIMENSION_LABELS } from "@/lib/schema";

const LEVEL_COLORS = ["#dc2626", "#d97706", "#2563eb", "#16a34a"];

export function CoachPortfolioHealth({
  distribution,
  prevDistribution,
  riskSummary,
  quarterLabel,
  atRiskDevelopers,
}: {
  distribution: DimensionDistribution[];
  prevDistribution: DimensionDistribution[];
  riskSummary: { totalDevelopers: number; atRiskCount: number; pctAtRisk: number };
  quarterLabel: string;
  atRiskDevelopers: string[];
}) {
  const chartData = distribution.map((d) => ({
    name: DIMENSION_LABELS[d.dimension],
    L1: d.counts[1],
    L2: d.counts[2],
    L3: d.counts[3],
    L4: d.counts[4],
  }));

  const prevMap = new Map(prevDistribution.map((d) => [d.dimension, d]));

  return (
    <section id="portfolio-health" className="space-y-6">
      <h2 className="text-lg font-medium text-zinc-900">My Portfolio Health</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Developers</p>
          <p className="text-xl font-semibold">{riskSummary.totalDevelopers}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">At risk</p>
          <p className="text-xl font-semibold">{riskSummary.atRiskCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">% at risk</p>
          <p className="text-xl font-semibold">{riskSummary.pctAtRisk.toFixed(1)}%</p>
        </div>
      </div>
      <p className="text-sm text-zinc-600">Quarter: {quarterLabel}</p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="L1" name="L1" stackId="a" fill={LEVEL_COLORS[0]} />
            <Bar dataKey="L2" name="L2" stackId="a" fill={LEVEL_COLORS[1]} />
            <Bar dataKey="L3" name="L3" stackId="a" fill={LEVEL_COLORS[2]} />
            <Bar dataKey="L4" name="L4" stackId="a" fill={LEVEL_COLORS[3]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-2 text-left font-medium text-zinc-700">Dimension</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-700">L1 %</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-700">L2 %</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-700">L3 %</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-700">L4 %</th>
              <th className="px-4 py-2 text-right font-medium text-zinc-700">vs prev quarter</th>
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
                  <td className="px-4 py-2 font-medium text-zinc-900">{DIMENSION_LABELS[d.dimension]}</td>
                  <td className="px-4 py-2 text-right">{d.pct1.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{d.pct2.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{d.pct3.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right">{d.pct4.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-right text-zinc-600">{shift}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {atRiskDevelopers.length > 0 && (
        <div>
          <p className="mb-2 font-medium text-zinc-800">At-risk developers</p>
          <p className="text-sm text-zinc-600">{atRiskDevelopers.join(", ")}</p>
        </div>
      )}
    </section>
  );
}
