/**
 * Distribution-only aggregations. No averages.
 * Counts and percentages per level (1-4), trend vs previous quarter, improved/declined/flat.
 */

import type { DeveloperQuarterSnapshot } from "./schema";
import { DIMENSION_KEYS, type DimensionKey } from "./schema";
import { computeDeveloperRisk, isAtRisk } from "./risk";

export interface LevelCounts {
  1: number;
  2: number;
  3: number;
  4: number;
  null: number;
}

export interface DimensionDistribution {
  dimension: DimensionKey;
  counts: LevelCounts;
  total: number;
  pct1: number;
  pct2: number;
  pct3: number;
  pct4: number;
}

function getScore(snap: DeveloperQuarterSnapshot, dim: DimensionKey): number | null {
  switch (dim) {
    case "techMastery": return snap.techMastery;
    case "buildTrust": return snap.buildTrust;
    case "resilientUnderPressure": return snap.resilientUnderPressure;
    case "teamPlayer": return snap.teamPlayer;
    case "moveFast": return snap.moveFast;
  }
}

/**
 * For org-wide view: one snapshot per developer per quarter (latest by timestamp).
 */
export function getSnapshotsOnePerDeveloper(
  snapshots: DeveloperQuarterSnapshot[],
  quarterKey: string
): DeveloperQuarterSnapshot[] {
  const byDev = new Map<string, DeveloperQuarterSnapshot>();
  for (const s of snapshots) {
    if (s.quarterKey !== quarterKey) continue;
    const key = s.consultantName;
    const existing = byDev.get(key);
    if (!existing || s.evaluationTimestamp > existing.evaluationTimestamp) {
      byDev.set(key, s);
    }
  }
  return Array.from(byDev.values());
}

/**
 * For a set of snapshots (e.g. one quarter, one coach's portfolio), compute distribution per dimension.
 */
export function getDistributionForSnapshots(
  snapshots: DeveloperQuarterSnapshot[],
  quarterKey: string
): DimensionDistribution[] {
  const inQuarter = snapshots.filter((s) => s.quarterKey === quarterKey);
  const result: DimensionDistribution[] = [];

  for (const dim of DIMENSION_KEYS) {
    const counts: LevelCounts = { 1: 0, 2: 0, 3: 0, 4: 0, null: 0 };
    for (const s of inQuarter) {
      const v = getScore(s, dim);
      if (v === 1) counts[1]++;
      else if (v === 2) counts[2]++;
      else if (v === 3) counts[3]++;
      else if (v === 4) counts[4]++;
      else counts.null++;
    }
    const total = inQuarter.length;
    result.push({
      dimension: dim,
      counts,
      total,
      pct1: total ? (counts[1] / total) * 100 : 0,
      pct2: total ? (counts[2] / total) * 100 : 0,
      pct3: total ? (counts[3] / total) * 100 : 0,
      pct4: total ? (counts[4] / total) * 100 : 0,
    });
  }
  return result;
}

/**
 * Trend for one developer: compare current quarter to previous.
 * Returns "up" | "down" | "flat" (any dimension up with no down = up; any down = down; else flat).
 */
export function getTrend(
  snapshots: DeveloperQuarterSnapshot[],
  coachName: string,
  consultantName: string,
  currentQuarterKey: string
): "up" | "down" | "flat" {
  const byQuarter = new Map<string, DeveloperQuarterSnapshot>();
  for (const s of snapshots) {
    if (s.coachName !== coachName || s.consultantName !== consultantName) continue;
    const existing = byQuarter.get(s.quarterKey);
    if (!existing || s.evaluationTimestamp > existing.evaluationTimestamp) {
      byQuarter.set(s.quarterKey, s);
    }
  }
  const quarterKeys = Array.from(byQuarter.keys()).sort();
  const curIdx = quarterKeys.indexOf(currentQuarterKey);
  if (curIdx <= 0) return "flat";
  const prevKey = quarterKeys[curIdx - 1];
  const cur = byQuarter.get(currentQuarterKey);
  const prev = byQuarter.get(prevKey);
  if (!cur || !prev) return "flat";
  let anyUp = false;
  let anyDown = false;
  for (const dim of DIMENSION_KEYS) {
    const c = getScore(cur, dim);
    const p = getScore(prev, dim);
    if (c != null && p != null) {
      if (c > p) anyUp = true;
      if (c < p) anyDown = true;
    }
  }
  if (anyDown) return "down";
  if (anyUp) return "up";
  return "flat";
}

/**
 * Improved = at least one dimension up, none down.
 * Declined = at least one dimension down.
 * Flat = no change.
 */
export function getImprovedDeclinedFlat(
  snapshots: DeveloperQuarterSnapshot[],
  coachName: string,
  currentQuarterKey: string
): { improved: number; declined: number; flat: number } {
  const developers = new Set<string>();
  for (const s of snapshots) {
    if (s.coachName !== coachName) continue;
    if (s.quarterKey === currentQuarterKey) developers.add(s.consultantName);
  }
  let improved = 0;
  let declined = 0;
  let flat = 0;
  for (const name of developers) {
    const t = getTrend(snapshots, coachName, name, currentQuarterKey);
    if (t === "up") improved++;
    else if (t === "down") declined++;
    else flat++;
  }
  return { improved, declined, flat };
}

/**
 * Risk summary: total developers, at-risk count, % at risk, breakdown by flag type.
 */
export function getRiskSummary(
  snapshots: DeveloperQuarterSnapshot[],
  quarterKey: string,
  options?: { coachName?: string }
): {
  totalDevelopers: number;
  atRiskCount: number;
  pctAtRisk: number;
  byFlag: { lowScore: number; declining: number; stagnant: number; dataGap: number };
} {
  const filtered = options?.coachName
    ? snapshots.filter((s) => s.coachName === options.coachName && s.quarterKey === quarterKey)
    : snapshots.filter((s) => s.quarterKey === quarterKey);
  const developers = new Map<string, { coachName: string }>();
  for (const s of filtered) {
    const key = `${s.coachName}\t${s.consultantName}`;
    if (!developers.has(key)) developers.set(key, { coachName: s.coachName });
  }
  const totalDevelopers = developers.size;
  let atRiskCount = 0;
  const byFlag = { lowScore: 0, declining: 0, stagnant: 0, dataGap: 0 };
  for (const [key] of developers) {
    const [c, name] = key.split("\t");
    const flags = computeDeveloperRisk(snapshots, c, name);
    if (isAtRisk(flags)) {
      atRiskCount++;
      if (flags.lowScore?.length) byFlag.lowScore++;
      if (flags.declining?.length) byFlag.declining++;
      if (flags.stagnant?.length) byFlag.stagnant++;
      if (flags.dataGap?.length) byFlag.dataGap++;
    }
  }
  return {
    totalDevelopers,
    atRiskCount,
    pctAtRisk: totalDevelopers ? (atRiskCount / totalDevelopers) * 100 : 0,
    byFlag,
  };
}

/**
 * Average of the 5 dimension scores for a snapshot (1–4). Nulls excluded; returns null if no scores.
 */
function averageScoreForSnapshot(snap: DeveloperQuarterSnapshot): number | null {
  const scores: number[] = [];
  for (const dim of DIMENSION_KEYS) {
    const v = getScore(snap, dim);
    if (v != null) scores.push(v);
  }
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export interface CoachQuarterMetric {
  coachName: string;
  quarterKey: string;
  quarterLabel: string;
  avgScore: number;
  developerCount: number;
}

/**
 * Average developer score by coach by quarter (from real snapshots).
 * One snapshot per developer per quarter; each developer's score = mean of their 5 dimensions.
 */
export function getCoachAverageScoreByQuarter(
  snapshots: DeveloperQuarterSnapshot[],
  quarters: { quarterKey: string; quarterLabel: string }[]
): CoachQuarterMetric[] {
  const result: CoachQuarterMetric[] = [];
  const coaches = new Set(snapshots.map((s) => s.coachName).filter(Boolean));

  for (const coach of coaches) {
    for (const q of quarters) {
      const onePerDev = getSnapshotsOnePerDeveloper(
        snapshots.filter((s) => s.coachName === coach),
        q.quarterKey
      );
      const scores: number[] = [];
      for (const s of onePerDev) {
        const avg = averageScoreForSnapshot(s);
        if (avg != null) scores.push(avg);
      }
      if (scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        result.push({
          coachName: coach,
          quarterKey: q.quarterKey,
          quarterLabel: q.quarterLabel,
          avgScore: Math.round(avgScore * 100) / 100,
          developerCount: onePerDev.length,
        });
      }
    }
  }
  return result;
}

export interface CoachLatestVsPriorRow {
  coachName: string;
  avgScore: number;
  developerCount: number;
  priorAvgScore: number;
  priorDeveloperCount: number;
  qoqChange: number;
}

/**
 * Latest quarter vs prior: one row per coach with avg score, developer count, and QoQ change.
 */
export function getCoachLatestVsPrior(
  metrics: CoachQuarterMetric[],
  latestQuarterKey: string,
  priorQuarterKey: string
): CoachLatestVsPriorRow[] {
  const byCoachQuarter = new Map<string, CoachQuarterMetric>();
  for (const m of metrics) {
    byCoachQuarter.set(`${m.coachName}\t${m.quarterKey}`, m);
  }
  const coaches = new Set(metrics.map((m) => m.coachName));
  const rows: CoachLatestVsPriorRow[] = [];

  for (const coach of coaches) {
    const latest = byCoachQuarter.get(`${coach}\t${latestQuarterKey}`);
    const prior = byCoachQuarter.get(`${coach}\t${priorQuarterKey}`);
    if (!latest) continue;
    const priorAvg = prior?.avgScore ?? latest.avgScore;
    const qoqChange = Math.round((latest.avgScore - priorAvg) * 100) / 100;
    rows.push({
      coachName: coach,
      avgScore: latest.avgScore,
      developerCount: latest.developerCount,
      priorAvgScore: prior?.avgScore ?? 0,
      priorDeveloperCount: prior?.developerCount ?? 0,
      qoqChange,
    });
  }

  return rows.sort((a, b) => b.qoqChange - a.qoqChange);
}

export interface DeveloperQuarterMetric {
  consultantName: string;
  quarterKey: string;
  quarterLabel: string;
  avgScore: number;
}

/**
 * Average score by developer (consultant) by quarter. One row per (consultantName, quarter).
 */
export function getDeveloperAverageScoreByQuarter(
  snapshots: DeveloperQuarterSnapshot[],
  quarters: { quarterKey: string; quarterLabel: string }[]
): DeveloperQuarterMetric[] {
  const result: DeveloperQuarterMetric[] = [];
  for (const q of quarters) {
    const onePerDev = getSnapshotsOnePerDeveloper(snapshots, q.quarterKey);
    for (const s of onePerDev) {
      const avg = averageScoreForSnapshot(s);
      if (avg != null) {
        result.push({
          consultantName: s.consultantName,
          quarterKey: q.quarterKey,
          quarterLabel: q.quarterLabel,
          avgScore: Math.round(avg * 100) / 100,
        });
      }
    }
  }
  return result;
}

/**
 * Org-wide risk summary: one row per developer (latest eval in quarter), then risk per developer.
 */
export function getRiskSummaryOrg(
  snapshots: DeveloperQuarterSnapshot[],
  quarterKey: string
): {
  totalDevelopers: number;
  atRiskCount: number;
  pctAtRisk: number;
  byFlag: { lowScore: number; declining: number; stagnant: number; dataGap: number };
} {
  const onePerDev = getSnapshotsOnePerDeveloper(snapshots, quarterKey);
  const totalDevelopers = onePerDev.length;
  let atRiskCount = 0;
  const byFlag = { lowScore: 0, declining: 0, stagnant: 0, dataGap: 0 };
  for (const s of onePerDev) {
    const flags = computeDeveloperRisk(snapshots, s.coachName, s.consultantName);
    if (isAtRisk(flags)) {
      atRiskCount++;
      if (flags.lowScore?.length) byFlag.lowScore++;
      if (flags.declining?.length) byFlag.declining++;
      if (flags.stagnant?.length) byFlag.stagnant++;
      if (flags.dataGap?.length) byFlag.dataGap++;
    }
  }
  return {
    totalDevelopers,
    atRiskCount,
    pctAtRisk: totalDevelopers ? (atRiskCount / totalDevelopers) * 100 : 0,
    byFlag,
  };
}
