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
import type { DimensionDistribution, DeveloperQuarterMetric } from "@/lib/aggregations";
import { DIMENSION_LABELS } from "@/lib/schema";
import type { DimensionKey } from "@/lib/schema";

type QuarterPoint = { quarterLabel: string; L1: number; L2: number; L3: number; L4: number };

type SeriesItem = {
  quarterKey: string;
  quarterLabel: string;
  dimensions: DimensionDistribution[];
};

const DEV_COLORS = ["#0369a1", "#15803d", "#b45309", "#7c2d12", "#4c1d95", "#be123c"];

export function TrendsClient({
  quarters,
  series,
  coachSeries,
  coaches,
  developerMetrics,
  developerNames,
}: {
  quarters: { quarterKey: string; quarterLabel: string }[];
  series: SeriesItem[];
  coachSeries: { coachName: string; quarters: SeriesItem[] }[];
  coaches: string[];
  developerMetrics: DeveloperQuarterMetric[];
  developerNames: string[];
}) {
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");
  const [developerSearch, setDeveloperSearch] = useState("");
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);

  const filteredDeveloperNames = useMemo(() => {
    const q = developerSearch.trim().toLowerCase();
    if (!q) return developerNames;
    return developerNames.filter((n) => n.toLowerCase().includes(q));
  }, [developerNames, developerSearch]);

  const developerChartData = useMemo(() => {
    const byQuarter = new Map<string, Record<string, number>>();
    for (const q of quarters) {
      byQuarter.set(q.quarterLabel, { quarterLabel: q.quarterLabel });
    }
    for (const m of developerMetrics) {
      if (!selectedDevelopers.includes(m.consultantName)) continue;
      const row = byQuarter.get(m.quarterLabel);
      if (row) row[m.consultantName] = m.avgScore;
    }
    return quarters.map((q) => {
      const row = byQuarter.get(q.quarterLabel) ?? { quarterLabel: q.quarterLabel };
      return { ...row, quarterLabel: q.quarterLabel };
    });
  }, [developerMetrics, quarters, selectedDevelopers]);

  const buildLineData = (items: SeriesItem[], dim: DimensionKey): QuarterPoint[] => {
    return items.map((item) => {
      const d = item.dimensions.find((x) => x.dimension === dim)!;
      return {
        quarterLabel: item.quarterLabel,
        L1: d.pct1,
        L2: d.pct2,
        L3: d.pct3,
        L4: d.pct4,
      };
    });
  };

  const dims: DimensionKey[] = [
    "techMastery",
    "buildTrust",
    "resilientUnderPressure",
    "teamPlayer",
    "moveFast",
  ];

  function toggleDeveloper(name: string) {
    setSelectedDevelopers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name].slice(-8)
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          Average score by developer (quarter over quarter)
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Search by name, then click a developer to add their trend to the graph below. Select up to 8.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="developer-search" className="sr-only">
            Search developers by name
          </label>
          <input
            id="developer-search"
            type="search"
            placeholder="Search developers by name…"
            value={developerSearch}
            onChange={(e) => setDeveloperSearch(e.target.value)}
            className="min-w-[240px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
          {developerSearch.trim() && (
            <span className="text-sm text-zinc-500">
              Showing {filteredDeveloperNames.length} of {developerNames.length} developers
            </span>
          )}
        </div>
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {filteredDeveloperNames.map((name) => {
              const selected = selectedDevelopers.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleDeveloper(name)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
                    selected
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <span aria-hidden>→</span>
                  {name}
                </button>
              );
            })}
          </div>
          {filteredDeveloperNames.length === 0 && (
            <p className="py-2 text-sm text-zinc-500">
              {developerSearch.trim() ? "No developers match your search." : "No developers."}
            </p>
          )}
        </div>
        {selectedDevelopers.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-medium text-zinc-800">Selected: {selectedDevelopers.join(", ")}</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={developerChartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="quarterLabel" tick={{ fontSize: 11, fill: "#71717a" }} />
                  <YAxis domain={[1, 4]} tick={{ fontSize: 11, fill: "#71717a" }} tickCount={5} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }}
                    formatter={(value: number) => [value?.toFixed(2) ?? "—", ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {selectedDevelopers.map((name, i) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      name={name}
                      stroke={DEV_COLORS[i % DEV_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          Org: % at each level over time
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Organization-wide distribution by dimension. Data from <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">data/evaluations.json</code>.
        </p>
        <div className="mt-4 space-y-6">
          {dims.map((dim) => {
            const data = buildLineData(series, dim);
            return (
              <div key={dim} className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-medium text-zinc-800">{DIMENSION_LABELS[dim]}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis dataKey="quarterLabel" tick={{ fontSize: 11, fill: "#71717a" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#71717a" }} domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, ""]}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="L1" name="L1" stroke="#dc2626" strokeWidth={2} />
                      <Line type="monotone" dataKey="L2" name="L2" stroke="#d97706" strokeWidth={2} />
                      <Line type="monotone" dataKey="L3" name="L3" stroke="#2563eb" strokeWidth={2} />
                      <Line type="monotone" dataKey="L4" name="L4" stroke="#16a34a" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">Compare two coaches</h2>
        <p className="mt-1 text-sm text-zinc-500">
          L3+L4 % by quarter for two coaches (real coach names from your data).
        </p>
        <div className="mt-4 flex gap-4">
          <select
            value={compareA}
            onChange={(e) => setCompareA(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Select coach A</option>
            {coaches.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={compareB}
            onChange={(e) => setCompareB(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm"
          >
            <option value="">Select coach B</option>
            {coaches.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {compareA && compareB && compareA !== compareB && (
          <div className="mt-4 space-y-6">
            {dims.slice(0, 2).map((dim) => {
              const coachAData = buildLineData(
                coachSeries.find((x) => x.coachName === compareA)!.quarters,
                dim
              );
              const coachBData = buildLineData(
                coachSeries.find((x) => x.coachName === compareB)!.quarters,
                dim
              );
              const combined = coachAData.map((_, i) => ({
                quarterLabel: coachAData[i]!.quarterLabel,
                [compareA]: coachAData[i]!.L3 + coachAData[i]!.L4,
                [compareB]: coachBData[i]!.L3 + coachBData[i]!.L4,
              }));
              return (
                <div key={dim} className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-sm font-medium text-zinc-800">{DIMENSION_LABELS[dim]} (L3+L4 %)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combined} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                        <XAxis dataKey="quarterLabel" tick={{ fontSize: 11, fill: "#71717a" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#71717a" }} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey={compareA}
                          name={compareA}
                          stroke="#2563eb"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey={compareB}
                          name={compareB}
                          stroke="#16a34a"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
