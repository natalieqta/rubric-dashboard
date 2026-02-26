"use client";

import { useState } from "react";
import {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  RATER_ROLES,
  SCORE_LABELS,
} from "@/lib/schema";
import type { DimensionKey } from "@/lib/schema";

type Score = 1 | 2 | 3 | 4;

export function FeedbackFormClient({ subjects }: { subjects: string[] }) {
  const [subjectName, setSubjectName] = useState("");
  const [raterRole, setRaterRole] = useState<string>(RATER_ROLES[0]);
  const [scores, setScores] = useState<Record<DimensionKey, Score>>({
    techMastery: 3,
    buildTrust: 3,
    resilientUnderPressure: 3,
    teamPlayer: 3,
    moveFast: 3,
  });
  const [assertions, setAssertions] = useState<Record<DimensionKey, string>>({
    techMastery: "",
    buildTrust: "",
    resilientUnderPressure: "",
    teamPlayer: "",
    moveFast: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const body = {
        subjectName: subjectName.trim(),
        raterRole,
        techMastery: scores.techMastery,
        techMasteryAssertions: assertions.techMastery || undefined,
        buildTrust: scores.buildTrust,
        buildTrustAssertions: assertions.buildTrust || undefined,
        resilientUnderPressure: scores.resilientUnderPressure,
        resilientUnderPressureAssertions: assertions.resilientUnderPressure || undefined,
        teamPlayer: scores.teamPlayer,
        teamPlayerAssertions: assertions.teamPlayer || undefined,
        moveFast: scores.moveFast,
        moveFastAssertions: assertions.moveFast || undefined,
      };
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Submission failed.");
        return;
      }
      setSuccess(data.message ?? "Feedback recorded.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Person you are evaluating (subject)</label>
        <select
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          <option value="">Select a person</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Your role relative to this person</label>
        <select
          value={raterRole}
          onChange={(e) => setRaterRole(e.target.value)}
          required
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        >
          {RATER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-800">Dimension ratings (1–4)</h3>
        {DIMENSION_KEYS.map((dim) => (
          <div key={dim} className="rounded border border-zinc-200 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-zinc-700">{DIMENSION_LABELS[dim]}</p>
            <div className="mb-2 flex flex-wrap gap-4">
              {([1, 2, 3, 4] as const).map((n) => (
                <label key={n} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={dim}
                    value={n}
                    checked={scores[dim] === n}
                    onChange={() => setScores((prev) => ({ ...prev, [dim]: n }))}
                    className="h-4 w-4 border-zinc-300 text-zinc-900"
                  />
                  <span className="text-sm text-zinc-700">
                    {n} – {SCORE_LABELS[n]}
                  </span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">Optional notes (assertions)</label>
              <textarea
                value={assertions[dim]}
                onChange={(e) => setAssertions((prev) => ({ ...prev, [dim]: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-700"
                placeholder="Optional"
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </button>
      </div>
    </form>
  );
}
