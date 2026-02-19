"use client";

import { useState } from "react";
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
import { ScoreBadge } from "@/components/ScoreBadge";
import { DIMENSION_LABELS } from "@/lib/schema";
import type { DeveloperQuarterSnapshot } from "@/lib/schema";

export function DeveloperDetailClient({
  history,
}: {
  history: DeveloperQuarterSnapshot[];
}) {
  const [expandedQuarter, setExpandedQuarter] = useState<string | null>(null);

  const sorted = [...history].sort((a, b) => a.quarterKey.localeCompare(b.quarterKey));
  const lineData = sorted.map((h) => ({
    quarter: h.quarterLabel,
    TechMastery: h.techMastery ?? 0,
    BuildTrust: h.buildTrust ?? 0,
    Resilient: h.resilientUnderPressure ?? 0,
    TeamPlayer: h.teamPlayer ?? 0,
    MoveFast: h.moveFast ?? 0,
  }));

  const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Score timeline</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="TechMastery" name="Tech Mastery" stroke={colors[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="BuildTrust" name="Build Trust" stroke={colors[1]} strokeWidth={2} />
              <Line type="monotone" dataKey="Resilient" name="Resilient" stroke={colors[2]} strokeWidth={2} />
              <Line type="monotone" dataKey="TeamPlayer" name="Team Player" stroke={colors[3]} strokeWidth={2} />
              <Line type="monotone" dataKey="MoveFast" name="Move Fast" stroke={colors[4]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-900">History by quarter</h2>
        <div className="space-y-4">
          {sorted.map((h) => {
            const isExpanded = expandedQuarter === h.quarterKey;
            return (
              <div
                key={h.quarterKey}
                className="rounded border border-zinc-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setExpandedQuarter(isExpanded ? null : h.quarterKey)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50"
                >
                  <span className="font-medium text-zinc-900">{h.quarterLabel}</span>
                  <div className="flex gap-2">
                    <ScoreBadge score={h.techMastery} />
                    <ScoreBadge score={h.buildTrust} />
                    <ScoreBadge score={h.resilientUnderPressure} />
                    <ScoreBadge score={h.teamPlayer} />
                    <ScoreBadge score={h.moveFast} />
                  </div>
                  <span className="text-zinc-400">{isExpanded ? "▼" : "▶"}</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-zinc-200 px-4 py-4">
                    <div className="space-y-4">
                      {(["techMastery", "buildTrust", "resilientUnderPressure", "teamPlayer", "moveFast"] as const).map(
                        (dim) => (
                          <details key={dim} className="text-sm">
                            <summary className="cursor-pointer font-medium text-zinc-800">
                              {DIMENSION_LABELS[dim]}:{" "}
                              <ScoreBadge score={h[dim] as 1 | 2 | 3 | 4 | null} />
                            </summary>
                            <p className="mt-1 whitespace-pre-wrap text-zinc-600">
                              {(h.assertions[dim] as string) || "—"}
                            </p>
                          </details>
                        )
                      )}
                      {h.summaryForBrainsNotes && (
                        <details className="text-sm">
                          <summary className="cursor-pointer font-medium text-zinc-800">
                            Summary for Brains Notes
                          </summary>
                          <p className="mt-1 whitespace-pre-wrap text-zinc-600">
                            {h.summaryForBrainsNotes}
                          </p>
                        </details>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
