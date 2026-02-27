/**
 * Load and expose evaluation data. Single source: Google Sheets via getRawEvaluationsFromSheet.
 * Builds latest evaluation per (coach, developer, quarter).
 */

import { getRawEvaluationsFromSheet } from "@/lib/evaluations-sheet";
import { getQuarterLabel } from "./quarters";
import { parseEvaluationRow, type RawEvaluationRow } from "./parse";
import type { ParsedEvaluation, DeveloperQuarterSnapshot } from "./schema";
import { listFeedback360 } from "./feedback-360";

/** Coaches to hide from lists and dashboards (e.g. no longer active). */
export const HIDDEN_COACH_NAMES = ["Erica Franken", "Gabriela Torres", "Vanessa Fernandez"] as const;

export function isHiddenCoach(name: string): boolean {
  return (HIDDEN_COACH_NAMES as readonly string[]).includes(name);
}

let cachedRaw: RawEvaluationRow[] | null = null;
let cachedParsed: ParsedEvaluation[] | null = null;
let cachedSnapshots: DeveloperQuarterSnapshot[] | null = null;

async function loadRaw(): Promise<RawEvaluationRow[]> {
  if (cachedRaw) return cachedRaw;
  const raw = await getRawEvaluationsFromSheet();
  cachedRaw = raw;
  return raw;
}

export async function getParsedEvaluations(options?: { now?: Date }): Promise<ParsedEvaluation[]> {
  if (cachedParsed) return cachedParsed;
  const raw = await loadRaw();
  const now = options?.now ?? new Date();
  cachedParsed = raw.map((row) => parseEvaluationRow(row, { now }) as ParsedEvaluation);
  return cachedParsed;
}

/** Latest evaluation per (coachName, consultantName, quarterKey). */
export async function getDeveloperQuarterSnapshots(options?: {
  now?: Date;
  coachName?: string;
}): Promise<DeveloperQuarterSnapshot[]> {
  if (cachedSnapshots && !options?.coachName) return cachedSnapshots;
  const parsed = await getParsedEvaluations(options);
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

export async function getUniqueCoachNames(): Promise<string[]> {
  const parsed = await getParsedEvaluations();
  const set = new Set(parsed.map((p) => p.coachName).filter(Boolean));
  return Array.from(set).filter((name) => !isHiddenCoach(name)).sort();
}

/** All quarter keys (e.g. 2025-Q2) sorted ascending; labels for display. */
export async function getQuartersSorted(options?: { now?: Date }): Promise<{ quarterKey: string; quarterLabel: string }[]> {
  const parsed = await getParsedEvaluations(options);
  const seen = new Map<string, string>();
  for (const p of parsed) {
    if (!seen.has(p.quarterKey)) seen.set(p.quarterKey, p.quarterLabel);
  }
  const keys = Array.from(seen.keys()).sort();
  return keys.map((quarterKey) => ({ quarterKey, quarterLabel: seen.get(quarterKey)! }));
}

/** Distinct consultant names from evaluation data (canonical subject list for 360 form). */
export async function getCanonicalSubjectNames(): Promise<string[]> {
  const parsed = await getParsedEvaluations();
  const set = new Set(parsed.map((p) => p.consultantName).filter(Boolean));
  return Array.from(set).sort();
}

/** Options for merged dashboard data. coachName set = coach view (only their developers); unset = admin org-wide. */
export interface GetMergedRecordsForDashboardOptions {
  coachName?: string;
}

/**
 * Returns evaluation-like records for dashboard: snapshots + normalized 360 submissions.
 * Scoped by coachName for coach (subjects = their developers) or org-wide for admin.
 * Distribution logic can count by level; no averages. Coach sees only their developers.
 */
export async function getMergedRecordsForDashboard(
  options?: GetMergedRecordsForDashboardOptions
): Promise<DeveloperQuarterSnapshot[]> {
  const snapshots = await getDeveloperQuarterSnapshots(options);
  const coachName = options?.coachName;

  const developerSet = coachName
    ? new Set(snapshots.map((s) => s.consultantName))
    : undefined;
  const subjectAllowlist =
    developerSet && developerSet.size > 0 ? Array.from(developerSet) : undefined;

  const feedback360 = listFeedback360({
    subjectNamesAllowlist: coachName ? subjectAllowlist : undefined,
  });

  const allSnapshotsForCoachMap = await getDeveloperQuarterSnapshots();
  const consultantToCoach = new Map<string, string>();
  for (const s of allSnapshotsForCoachMap) {
    if (!consultantToCoach.has(s.consultantName)) {
      consultantToCoach.set(s.consultantName, s.coachName);
    }
  }

  const quarters = await getQuartersSorted();
  const quarterLabelByKey = new Map(quarters.map((q) => [q.quarterKey, q.quarterLabel]));

  function quarterKeyToLabel(quarterKey: string): string {
    const existing = quarterLabelByKey.get(quarterKey);
    if (existing) return existing;
    const m = quarterKey.match(/^(\d{4})-Q([1-4])$/);
    if (!m) return quarterKey;
    const year = parseInt(m[1]!, 10);
    const quarter = parseInt(m[2]!, 10) as 1 | 2 | 3 | 4;
    return getQuarterLabel(year, quarter);
  }

  const converted: DeveloperQuarterSnapshot[] = feedback360.map((sub) => ({
    coachName: coachName ?? consultantToCoach.get(sub.subjectName) ?? "Unknown",
    consultantName: sub.subjectName,
    quarterLabel: quarterKeyToLabel(sub.quarterKey),
    quarterKey: sub.quarterKey,
    techMastery: sub.techMastery,
    buildTrust: sub.buildTrust,
    resilientUnderPressure: sub.resilientUnderPressure,
    teamPlayer: sub.teamPlayer,
    moveFast: sub.moveFast,
    assertions: {
      techMastery: sub.techMasteryAssertions ?? "",
      buildTrust: sub.buildTrustAssertions ?? "",
      resilientUnderPressure: sub.resilientUnderPressureAssertions ?? "",
      teamPlayer: sub.teamPlayerAssertions ?? "",
      moveFast: sub.moveFastAssertions ?? "",
    },
    summaryForBrainsNotes: "",
    evaluationTimestamp: new Date(sub.timestamp),
  }));

  return [...snapshots, ...converted];
}

export function invalidateEvaluationsCache(): void {
  cachedRaw = null;
  cachedParsed = null;
  cachedSnapshots = null;
}
