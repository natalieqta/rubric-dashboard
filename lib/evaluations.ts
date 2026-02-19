/**
 * Load and expose evaluation data. Single source: data/evaluations.json.
 * Builds latest evaluation per (coach, developer, quarter).
 * Uses static import so this module is safe in Edge runtime (no Node.js "fs").
 */

import evaluationsData from "@/data/evaluations.json";
import { parseEvaluationRow, type RawEvaluationRow } from "./parse";
import type { ParsedEvaluation, DeveloperQuarterSnapshot } from "./schema";

/** Coaches to hide from lists and dashboards (e.g. no longer active). */
export const HIDDEN_COACH_NAMES = ["Erica Franken", "Gabriela Torres", "Vanessa Fernandez"] as const;

export function isHiddenCoach(name: string): boolean {
  return (HIDDEN_COACH_NAMES as readonly string[]).includes(name);
}

let cachedParsed: ParsedEvaluation[] | null = null;
let cachedSnapshots: DeveloperQuarterSnapshot[] | null = null;

function loadRaw(): unknown[] {
  const data = evaluationsData as unknown;
  return Array.isArray(data) ? data : [];
}

export function getParsedEvaluations(options?: { now?: Date }): ParsedEvaluation[] {
  if (cachedParsed) return cachedParsed;
  const raw = loadRaw() as RawEvaluationRow[];
  const now = options?.now ?? new Date();
  cachedParsed = raw.map((row) => parseEvaluationRow(row, { now }) as ParsedEvaluation);
  return cachedParsed;
}

/** Latest evaluation per (coachName, consultantName, quarterKey). */
export function getDeveloperQuarterSnapshots(options?: {
  now?: Date;
  coachName?: string;
}): DeveloperQuarterSnapshot[] {
  if (cachedSnapshots && !options?.coachName) return cachedSnapshots;
  const parsed = getParsedEvaluations(options);
  const byKey = new Map<string, ParsedEvaluation>();
  for (const p of parsed) {
    if (options?.coachName && p.coachName !== options.coachName) continue;
    const key = `${p.coachName}\t${p.consultantName}\t${p.quarterKey}`;
    const existing = byKey.get(key);
    if (!existing || p.timestamp > existing.timestamp) byKey.set(key, p);
  }
  const snapshots: DeveloperQuarterSnapshot[] = Array.from(byKey.values()).map((p) => ({
    coachName: p.coachName,
    consultantName: p.consultantName,
    quarterLabel: p.quarterLabel,
    quarterKey: p.quarterKey,
    techMastery: p.techMastery,
    buildTrust: p.buildTrust,
    resilientUnderPressure: p.resilientUnderPressure,
    teamPlayer: p.teamPlayer,
    moveFast: p.moveFast,
    assertions: {
      techMastery: p.techMasteryAssertions,
      buildTrust: p.buildTrustAssertions,
      resilientUnderPressure: p.resilientUnderPressureAssertions,
      teamPlayer: p.teamPlayerAssertions,
      moveFast: p.moveFastAssertions,
    },
    summaryForBrainsNotes: p.summaryForBrainsNotes,
    evaluationTimestamp: p.timestamp,
  }));
  if (!options?.coachName) cachedSnapshots = snapshots;
  return snapshots;
}

export function getUniqueCoachNames(): string[] {
  const parsed = getParsedEvaluations();
  const set = new Set(parsed.map((p) => p.coachName).filter(Boolean));
  return Array.from(set).filter((name) => !isHiddenCoach(name)).sort();
}

/** All quarter keys (e.g. 2025-Q2) sorted ascending; labels for display. */
export function getQuartersSorted(options?: { now?: Date }): { quarterKey: string; quarterLabel: string }[] {
  const parsed = getParsedEvaluations(options);
  const seen = new Map<string, string>();
  for (const p of parsed) {
    if (!seen.has(p.quarterKey)) seen.set(p.quarterKey, p.quarterLabel);
  }
  const keys = Array.from(seen.keys()).sort();
  return keys.map((quarterKey) => ({ quarterKey, quarterLabel: seen.get(quarterKey)! }));
}

export function invalidateEvaluationsCache(): void {
  cachedParsed = null;
  cachedSnapshots = null;
}
