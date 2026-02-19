"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { CoachQuarterMetric, CoachLatestVsPriorRow } from "@/lib/aggregations";

const COACH_COLORS = [
  "#0f766e", "#0369a1", "#7c2d12", "#4c1d95", "#0d9488",
  "#b45309", "#1e40af", "#15803d", "#a21caf", "#be123c", "#0e7490",
];

function getCoachColor(index: number) {
  return COACH_COLORS[index % COACH_COLORS.length];
}

export function CoachTrendsClient({
  metrics,
  latestVsPrior,
  quarterLabels,
  latestQuarterLabel,
  priorQuarterLabel,
}: {
  metrics: CoachQuarterMetric[];
  latestVsPrior: CoachLatestVsPriorRow[];
  quarterLabels: string[];
  latestQuarterLabel: string;
  priorQuarterLabel: string;
}) {
  const [nameSearch, setNameSearch] = useState("");
  const coaches = useMemo(
    () => [...new Set(metrics.map((m) => m.coachName))].sort(),
    [metrics]
  );
  const filteredCoaches = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    if (!q) return coaches;
    return coaches.filter((c) => c.toLowerCase().includes(q));
  }, [coaches, nameSearch]);

  const byQuarter = new Map<string, Record<string, number>>();
  for (const q of quarterLabels) {
    byQuarter.set(q, { quarterLabel: q });
  }
  for (const m of metrics) {
    const row = byQuarter.get(m.quarterLabel);
    if (row) row[m.coachName] = m.avgScore;
  }
  const chartData = quarterLabels.map((q) => {
    const row = byQuarter.get(q) ?? { quarterLabel: q };
    return { ...row, quarterLabel: q };
  });

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
          Average developer score by coach (quarter over quarter)
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Compare average developer scores by coach quarter over quarter. Use this to see which coaches are improving their developers.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="coach-search" className="sr-only">
            Search coaches by name
          </label>
          <input
            id="coach-search"
            type="search"
            placeholder="Search coaches by name…"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="min-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          {nameSearch.trim() && (
            <span className="text-sm text-zinc-500">
              Showing {filteredCoaches.length} of {coaches.length} coaches
            </span>
          )}
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="p-4 pb-0">
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 12, right: 16, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis
                    dataKey="quarterLabel"
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={{ stroke: "#d4d4d8" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[1, 4]}
                    tick={{ fontSize: 11, fill: "#71717a" }}
                    axisLine={false}
                    tickLine={false}
                    tickCount={5}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: "1px solid #e4e4e7",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number) => [value?.toFixed(2) ?? "—", ""]}
                    labelFormatter={(label) => `Quarter: ${label}`}
                  />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: 16, paddingBottom: 8 }}
                    formatter={(value) => <span className="text-xs text-zinc-700">{value}</span>}
                    iconType="line"
                    iconSize={8}
                  />
                  {filteredCoaches.map((coach, i) => (
                    <Line
                      key={coach}
                      type="monotone"
                      dataKey={coach}
                      name={coach}
                      stroke={getCoachColor(i)}
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 2 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {filteredCoaches.length === 0 ? (
            <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-4 text-center text-sm text-zinc-500">
              {nameSearch.trim() ? "No coaches match your search. Try a different name." : "No coach data."}
            </div>
          ) : (
            <div className="max-h-24 overflow-y-auto border-t border-zinc-100 bg-zinc-50/50 px-4 py-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {filteredCoaches.map((coach, i) => (
                  <span key={coach} className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
                    <span
                      className="inline-block h-0.5 w-3 rounded-full"
                      style={{ backgroundColor: getCoachColor(i) }}
                    />
                    {coach}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
          Latest quarter vs prior ({latestQuarterLabel} vs {priorQuarterLabel})
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-5 py-3 text-left font-medium text-zinc-700">Coach</th>
                  <th className="px-5 py-3 text-right font-medium text-zinc-700">Avg score</th>
                  <th className="px-5 py-3 text-right font-medium text-zinc-700">Developers</th>
                  <th className="px-5 py-3 text-right font-medium text-zinc-700">QoQ change</th>
                </tr>
              </thead>
              <tbody>
                {latestVsPrior.map((row) => (
                  <tr
                    key={row.coachName}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50"
                  >
                    <td className="px-5 py-3 font-medium text-zinc-900">{row.coachName}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-zinc-700">
                      {row.avgScore.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-zinc-600">
                      {row.developerCount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {row.qoqChange > 0 ? (
                        <span className="font-medium text-emerald-600">+{row.qoqChange.toFixed(2)}</span>
                      ) : row.qoqChange < 0 ? (
                        <span className="font-medium text-rose-600">{row.qoqChange.toFixed(2)}</span>
                      ) : (
                        <span className="text-zinc-500">0.00</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
