"use client";

import { useState, useEffect, useCallback } from "react";

type Submission = {
  id: string;
  raterId: string;
  raterName: string;
  raterRole: string;
  subjectName: string;
  quarterKey: string;
  timestamp: string;
  techMastery: number;
  buildTrust: number;
  resilientUnderPressure: number;
  teamPlayer: number;
  moveFast: number;
};

type QuarterOption = { quarterKey: string; quarterLabel: string };

export function FeedbackSubmissionsClient({
  quarterOptions,
  monthOptions,
}: {
  quarterOptions: QuarterOption[];
  monthOptions: string[];
}) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quarter, setQuarter] = useState<string>("");
  const [month, setMonth] = useState<string>("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (quarter) params.set("quarter", quarter);
      if (month) params.set("month", month);
      const res = await fetch(`/api/feedback?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [quarter, month]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          Quarter
          <select
            className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800"
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
          >
            <option value="">All</option>
            {quarterOptions.map((q) => (
              <option key={q.quarterKey} value={q.quarterKey}>
                {q.quarterLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          Month
          <select
            className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">All</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-zinc-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <p className="text-sm text-zinc-600">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Rater</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Rater role</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Quarter</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Tech</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Trust</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Resilient</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Team</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-700">Move fast</th>
                </tr>
              </thead>
              <tbody>
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 text-center text-zinc-500">
                      No submissions match the filters.
                    </td>
                  </tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-100">
                      <td className="px-4 py-2 font-medium text-zinc-900">{s.subjectName}</td>
                      <td className="px-4 py-2 text-zinc-700">{s.raterName}</td>
                      <td className="px-4 py-2 text-zinc-700">{s.raterRole}</td>
                      <td className="px-4 py-2 text-zinc-700">{s.quarterKey}</td>
                      <td className="px-4 py-2 text-zinc-600">
                        {new Date(s.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-zinc-700">{s.techMastery}</td>
                      <td className="px-4 py-2 text-zinc-700">{s.buildTrust}</td>
                      <td className="px-4 py-2 text-zinc-700">{s.resilientUnderPressure}</td>
                      <td className="px-4 py-2 text-zinc-700">{s.teamPlayer}</td>
                      <td className="px-4 py-2 text-zinc-700">{s.moveFast}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
