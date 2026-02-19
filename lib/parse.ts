/**
 * Parse raw sheet row into normalized evaluation.
 * Extract leading integer from score fields; N/A or empty -> null.
 * Never use Average Score column.
 */

import type { Score } from "./schema";
import { getQuarterLabelFromDate, getQuarterKeyFromDate } from "./quarters";

const CONSULTANT_KEY = "Consultant Being Evaluated (First & Last Name as shown in Brains)";
const RAW_KEYS = {
  timestamp: "Timestamp",
  coachName: "Coach Name",
  consultantName: CONSULTANT_KEY,
  techMastery: "Tech Mastery",
  techMasteryAssertions: "'Tech Mastery' Assertions",
  buildTrust: "Build Trust",
  buildTrustAssertions: "'Build Trust' Assertions",
  resilientUnderPressure: "Resilient Under Stress",
  resilientUnderPressureAssertions: "'Resilient Under Pressure' Stress",
  teamPlayer: "Team Player",
  teamPlayerAssertions: "'Team Player' Assertions",
  moveFast: "Move Fast",
  moveFastAssertions: "'Move Fast' Assertions",
  summaryForBrainsNotes: "Summary for Brains Notes",
} as const;

function parseScore(value: unknown): Score {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === "" || s.toUpperCase() === "N/A") return null;
  const match = s.match(/^\s*(\d)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (n >= 1 && n <= 4) return n as Score;
  return null;
}

function parseTimestamp(value: unknown): Date {
  if (value == null) return new Date(0);
  const s = String(value).trim();
  if (!s) return new Date(0);
  // Support "4/17/2025 17:16:47" (MM/DD/YYYY HH:mm:ss)
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function str(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export interface RawEvaluationRow {
  "Timestamp"?: unknown;
  "Coach Name"?: unknown;
  [key: string]: unknown;
}

export function parseEvaluationRow(
  row: RawEvaluationRow,
  options?: { now?: Date }
): {
  timestamp: Date;
  coachName: string;
  consultantName: string;
  techMastery: Score;
  techMasteryAssertions: string;
  buildTrust: Score;
  buildTrustAssertions: string;
  resilientUnderPressure: Score;
  resilientUnderPressureAssertions: string;
  teamPlayer: Score;
  teamPlayerAssertions: string;
  moveFast: Score;
  moveFastAssertions: string;
  summaryForBrainsNotes: string;
  quarterLabel: string;
  quarterKey: string;
} {
  const timestamp = parseTimestamp(row[RAW_KEYS.timestamp]);
  const quarterLabel = getQuarterLabelFromDate(timestamp, options);
  const quarterKey = getQuarterKeyFromDate(timestamp);
  return {
    timestamp,
    coachName: str(row[RAW_KEYS.coachName]),
    consultantName: str(row[RAW_KEYS.consultantName]),
    techMastery: parseScore(row[RAW_KEYS.techMastery]),
    techMasteryAssertions: str(row[RAW_KEYS.techMasteryAssertions]),
    buildTrust: parseScore(row[RAW_KEYS.buildTrust]),
    buildTrustAssertions: str(row[RAW_KEYS.buildTrustAssertions]),
    resilientUnderPressure: parseScore(row[RAW_KEYS.resilientUnderPressure]),
    resilientUnderPressureAssertions: str(row[RAW_KEYS.resilientUnderPressureAssertions]),
    teamPlayer: parseScore(row[RAW_KEYS.teamPlayer]),
    teamPlayerAssertions: str(row[RAW_KEYS.teamPlayerAssertions]),
    moveFast: parseScore(row[RAW_KEYS.moveFast]),
    moveFastAssertions: str(row[RAW_KEYS.moveFastAssertions]),
    summaryForBrainsNotes: str(row[RAW_KEYS.summaryForBrainsNotes]),
    quarterLabel,
    quarterKey,
  };
}
