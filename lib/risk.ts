/**
 * Risk flagging per developer. No averages.
 * Low Score, Declining, Stagnant, Data Gap.
 */

import type { DimensionKey } from "./schema";
import { DIMENSION_KEYS } from "./schema";
import type { DeveloperQuarterSnapshot } from "./schema";
import type { DeveloperRiskFlags } from "./schema";

function getScores(snap: DeveloperQuarterSnapshot): (number | null)[] {
  return [
    snap.techMastery,
    snap.buildTrust,
    snap.resilientUnderPressure,
    snap.teamPlayer,
    snap.moveFast,
  ];
}

function dimensionAt(i: number): DimensionKey {
  return DIMENSION_KEYS[i];
}

/**
 * Build timeline per (coachName, consultantName): quarters in order with latest snapshot per quarter.
 */
export function getDeveloperTimeline(
  snapshots: DeveloperQuarterSnapshot[],
  coachName: string,
  consultantName: string
): Map<string, DeveloperQuarterSnapshot> {
  const byQuarter = new Map<string, DeveloperQuarterSnapshot>();
  for (const s of snapshots) {
    if (s.coachName !== coachName || s.consultantName !== consultantName) continue;
    const existing = byQuarter.get(s.quarterKey);
    if (!existing || s.evaluationTimestamp > existing.evaluationTimestamp) {
      byQuarter.set(s.quarterKey, s);
    }
  }
  return byQuarter;
}

/**
 * Compute risk flags for one developer (under one coach).
 */
export function computeDeveloperRisk(
  snapshots: DeveloperQuarterSnapshot[],
  coachName: string,
  consultantName: string
): DeveloperRiskFlags {
  const timeline = getDeveloperTimeline(snapshots, coachName, consultantName);
  const quarterKeys = Array.from(timeline.keys()).sort();
  if (quarterKeys.length === 0) {
    return { lowScore: null, declining: null, stagnant: null, dataGap: null };
  }
  const currentKey = quarterKeys[quarterKeys.length - 1];
  const previousKey = quarterKeys.length >= 2 ? quarterKeys[quarterKeys.length - 2] : null;
  const current = timeline.get(currentKey)!;
  const previous = previousKey ? timeline.get(previousKey) : null;

  const lowScore: DimensionKey[] = [];
  const declining: DimensionKey[] = [];
  const stagnant: DimensionKey[] = [];
  const dataGap: DimensionKey[] = [];

  const currentScores = getScores(current);
  const previousScores = previous ? getScores(previous) : null;

  for (let i = 0; i < 5; i++) {
    const dim = dimensionAt(i);
    const cur = currentScores[i];
    const prev = previousScores ? previousScores[i] : null;

    if (cur === 1) lowScore.push(dim);

    if (prev != null && cur != null && cur < prev) {
      declining.push(dim);
    }

    if (cur === 2) {
      let consecutiveL2 = 1;
      let idx = quarterKeys.indexOf(currentKey) - 1;
      while (idx >= 0) {
        const s = timeline.get(quarterKeys[idx])!;
        const scores = getScores(s);
        if (scores[i] === 2) consecutiveL2++;
        else break;
        idx--;
      }
      if (consecutiveL2 >= 2) stagnant.push(dim);
    }

    if (cur == null) {
      let consecutiveNull = 1;
      let idx = quarterKeys.indexOf(currentKey) - 1;
      while (idx >= 0) {
        const s = timeline.get(quarterKeys[idx])!;
        const scores = getScores(s);
        if (scores[i] == null) consecutiveNull++;
        else break;
        idx--;
      }
      if (consecutiveNull >= 2) dataGap.push(dim);
    }
  }

  return {
    lowScore: lowScore.length ? lowScore : null,
    declining: declining.length >= 2 ? declining : null,
    stagnant: stagnant.length ? stagnant : null,
    dataGap: dataGap.length ? dataGap : null,
  };
}

export function isAtRisk(flags: DeveloperRiskFlags): boolean {
  return !!(
    (flags.lowScore && flags.lowScore.length > 0) ||
    (flags.declining && flags.declining.length > 0) ||
    (flags.stagnant && flags.stagnant.length > 0) ||
    (flags.dataGap && flags.dataGap.length > 0)
  );
}
