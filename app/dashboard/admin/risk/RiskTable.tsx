"use client";

import { useState, useMemo, Fragment } from "react";
import { RiskBadges } from "@/components/RiskBadges";
import { ScoreBadge } from "@/components/ScoreBadge";
import { TrendArrow } from "@/components/TrendArrow";
import { DIMENSION_LABELS, type Score } from "@/lib/schema";
import type { DeveloperRiskFlags } from "@/lib/schema";
import type { DeveloperQuarterSnapshot } from "@/lib/schema";

type Row = {
  consultantName: string;
  coachName: string;
  quarterKey: string;
  quarterLabel: string;
  flags: DeveloperRiskFlags;
  techMastery: number | null;
  buildTrust: number | null;
  resilientUnderPressure: number | null;
  teamPlayer: number | null;
  moveFast: number | null;
  trend: "up" | "down" | "flat";
  history: DeveloperQuarterSnapshot[];
};

export function RiskTable({
  rows,
  quarters,
  coaches,
}: {
  rows: Row[];
  quarters: { quarterKey: string; quarterLabel: string }[];
  coaches: string[];
}) {
  const [sortBy, setSortBy] = useState<keyof Row | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterFlag, setFilterFlag] = useState<string>("");
  const [filterCoach, setFilterCoach] = useState<string>("");
  const [filterQuarter, setFilterQuarter] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = rows;
    if (filterCoach) list = list.filter((r) => r.coachName === filterCoach);
    if (filterQuarter) list = list.filter((r) => r.quarterKey === filterQuarter);
    if (filterFlag) {
      list = list.filter((r) => {
        if (filterFlag === "lowScore" && r.flags.lowScore?.length) return true;
        if (filterFlag === "declining" && r.flags.declining?.length) return true;
        if (filterFlag === "stagnant" && r.flags.stagnant?.length) return true;
        if (filterFlag === "dataGap" && r.flags.dataGap?.length) return true;
        return false;
      });
    }
    if (sortBy) {
      list = [...list].sort((a, b) => {
        const av = a[sortBy as keyof Row];
        const bv = b[sortBy as keyof Row];
        if (typeof av === "string" && typeof bv === "string")
          return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        return 0;
      });
    }
    return list;
  }, [rows, sortBy, sortDir, filterFlag, filterCoach, filterQuarter]);

  function toggleSort(col: keyof Row) {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortBy(col);
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <select
          value={filterFlag}
          onChange={(e) => setFilterFlag(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All flags</option>
          <option value="lowScore">Low Score</option>
          <option value="declining">Declining</option>
          <option value="stagnant">Stagnant</option>
          <option value="dataGap">Data Gap</option>
        </select>
        <select
          value={filterCoach}
          onChange={(e) => setFilterCoach(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All coaches</option>
          {coaches.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterQuarter}
          onChange={(e) => setFilterQuarter(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All quarters</option>
          {quarters.map((q) => (
            <option key={q.quarterKey} value={q.quarterKey}>
              {q.quarterLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="w-8"></th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-zinc-700 hover:bg-zinc-100"
                onClick={() => toggleSort("consultantName")}
              >
                Developer {sortBy === "consultantName" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-zinc-700 hover:bg-zinc-100"
                onClick={() => toggleSort("coachName")}
              >
                Coach {sortBy === "coachName" && (sortDir === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Risk flags</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Scores</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Trend</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Quarter</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const key = `${r.coachName}\t${r.consultantName}`;
              const isExpanded = expanded.has(key);
              return (
                <Fragment key={key}>
                  <tr
                    key={key}
                    className="cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
                    onClick={() => toggleExpand(key)}
                  >
                    <td className="px-4 py-2">{isExpanded ? "▼" : "▶"}</td>
                    <td className="px-4 py-2 font-medium text-zinc-900">{r.consultantName}</td>
                    <td className="px-4 py-2 text-zinc-700">{r.coachName}</td>
                    <td className="px-4 py-2">
                      <RiskBadges flags={r.flags} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <ScoreBadge score={r.techMastery as Score} />
                        <ScoreBadge score={r.buildTrust as Score} />
                        <ScoreBadge score={r.resilientUnderPressure as Score} />
                        <ScoreBadge score={r.teamPlayer as Score} />
                        <ScoreBadge score={r.moveFast as Score} />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <TrendArrow trend={r.trend} />
                    </td>
                    <td className="px-4 py-2 text-zinc-600">{r.quarterLabel}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${key}-exp`} className="bg-zinc-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-4">
                          <p className="font-medium text-zinc-900">Full history</p>
                          {r.history
                            .sort((a, b) => a.quarterKey.localeCompare(b.quarterKey))
                            .map((h) => (
                              <div
                                key={h.quarterKey}
                                className="rounded border border-zinc-200 bg-white p-4"
                              >
                                <p className="mb-2 font-medium text-zinc-800">
                                  {h.quarterLabel}
                                </p>
                                <div className="mb-2 flex gap-2">
                                  {(["techMastery", "buildTrust", "resilientUnderPressure", "teamPlayer", "moveFast"] as const).map(
                                    (dim) => (
                                      <span key={dim} className="text-sm">
                                        {DIMENSION_LABELS[dim]}:{" "}
<ScoreBadge score={h[dim] as Score} />
                                      </span>
                                    )
                                  )}
                                </div>
                                <details className="text-sm text-zinc-600">
                                  <summary>Assertions</summary>
                                  <ul className="mt-1 list-inside space-y-1">
                                    <li>
                                      Tech Mastery: {h.assertions.techMastery || "—"}
                                    </li>
                                    <li>Build Trust: {h.assertions.buildTrust || "—"}</li>
                                    <li>
                                      Resilient: {h.assertions.resilientUnderPressure || "—"}
                                    </li>
                                    <li>Team Player: {h.assertions.teamPlayer || "—"}</li>
                                    <li>Move Fast: {h.assertions.moveFast || "—"}</li>
                                  </ul>
                                </details>
                                {h.summaryForBrainsNotes ? (
                                  <details className="mt-2 text-sm text-zinc-600">
                                    <summary>Summary</summary>
                                    <p className="mt-1 whitespace-pre-wrap">
                                      {h.summaryForBrainsNotes}
                                    </p>
                                  </details>
                                ) : null}
                              </div>
                            ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="py-8 text-center text-zinc-500">No at-risk developers match the filters.</p>
      )}
    </div>
  );
}
