/**
 * 360° feedback storage and listing. Single source: data/feedback-360.json.
 * Used by merge layer (lib/evaluations.ts) and feedback API.
 */

import path from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { getQuarterKeyFromDate } from "@/lib/quarters";
import type { Feedback360Submission } from "./schema";
import { RATER_ROLES } from "./schema";
import type { RaterRole } from "./schema";

import feedback360Data from "@/data/feedback-360.json";

const FALLBACK_DATA = [] as Feedback360Submission[];

function getDataPath(): string {
  return path.join(process.cwd(), "data", "feedback-360.json");
}

function loadFromFile(): Feedback360Submission[] {
  try {
    const filePath = getDataPath();
    if (!existsSync(filePath)) return [];
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as Feedback360Submission[]) : [];
  } catch {
    return [];
  }
}

/** In Node (API routes) reads from file so writes are visible; elsewhere uses static import. */
function loadSubmissions(): Feedback360Submission[] {
  if (typeof process !== "undefined" && process.versions?.node) {
    return loadFromFile();
  }
  const data = feedback360Data as unknown;
  return Array.isArray(data) ? (data as Feedback360Submission[]) : FALLBACK_DATA;
}

function saveSubmissions(list: Feedback360Submission[]): void {
  const filePath = getDataPath();
  writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
}

export interface SubmitFeedback360Payload {
  subjectName: string;
  raterRole: string;
  techMastery: number;
  buildTrust: number;
  resilientUnderPressure: number;
  teamPlayer: number;
  moveFast: number;
  techMasteryAssertions?: string;
  buildTrustAssertions?: string;
  resilientUnderPressureAssertions?: string;
  teamPlayerAssertions?: string;
  moveFastAssertions?: string;
}

export interface SubmitFeedback360Rater {
  raterId: string;
  raterName: string;
}

const DIMENSION_KEYS = [
  "techMastery",
  "buildTrust",
  "resilientUnderPressure",
  "teamPlayer",
  "moveFast",
] as const;

function isValidScore(n: number): n is 1 | 2 | 3 | 4 {
  return Number.isInteger(n) && n >= 1 && n <= 4;
}

/**
 * Validate payload and rater; replace or append; save to file.
 * Caller must pass subjectAllowlist (e.g. from getCanonicalSubjectNames()) to avoid circular dependency.
 */
export function submitFeedback360(
  payload: SubmitFeedback360Payload,
  rater: SubmitFeedback360Rater,
  options: { subjectAllowlist: string[] }
): { id: string; quarterKey: string; message: string } {
  const subjects = options.subjectAllowlist;
  const subjectTrimmed = payload.subjectName.trim();
  if (!subjects.includes(subjectTrimmed)) {
    throw new Error(`Subject must be one of: ${subjects.join(", ")}`);
  }
  if (!RATER_ROLES.includes(payload.raterRole as RaterRole)) {
    throw new Error(`raterRole must be one of: ${RATER_ROLES.join(", ")}`);
  }
  for (const key of DIMENSION_KEYS) {
    const v = payload[key];
    if (!isValidScore(v)) {
      throw new Error(`Dimension ${key} must be 1, 2, 3, or 4`);
    }
  }

  const now = new Date();
  const quarterKey = getQuarterKeyFromDate(now);
  const timestamp = now.toISOString();

  const record: Feedback360Submission = {
    id: `360-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    raterId: rater.raterId,
    raterName: rater.raterName,
    raterRole: payload.raterRole as RaterRole,
    subjectName: subjectTrimmed,
    quarterKey,
    timestamp,
    techMastery: payload.techMastery as 1 | 2 | 3 | 4,
    techMasteryAssertions: payload.techMasteryAssertions,
    buildTrust: payload.buildTrust as 1 | 2 | 3 | 4,
    buildTrustAssertions: payload.buildTrustAssertions,
    resilientUnderPressure: payload.resilientUnderPressure as 1 | 2 | 3 | 4,
    resilientUnderPressureAssertions: payload.resilientUnderPressureAssertions,
    teamPlayer: payload.teamPlayer as 1 | 2 | 3 | 4,
    teamPlayerAssertions: payload.teamPlayerAssertions,
    moveFast: payload.moveFast as 1 | 2 | 3 | 4,
    moveFastAssertions: payload.moveFastAssertions,
  };

  const list = loadFromFile();
  const idx = list.findIndex(
    (s) =>
      s.raterId === rater.raterId &&
      s.subjectName === subjectTrimmed &&
      s.quarterKey === quarterKey
  );
  if (idx >= 0) {
    list[idx] = { ...record, id: list[idx].id };
  } else {
    list.push(record);
  }
  saveSubmissions(list);

  return {
    id: record.id,
    quarterKey,
    message: "Feedback recorded.",
  };
}

export interface ListFeedback360Options {
  quarter?: string;
  month?: string;
  /** When set, only return submissions whose subjectName is in this set (e.g. coach's developers). */
  subjectNamesAllowlist?: string[];
}

/**
 * Return 360 submissions filtered by quarter (quarterKey), month (year-month from timestamp), and/or subject allowlist.
 * Used by merge layer and by GET /api/feedback for list/filter.
 */
export function listFeedback360(options?: ListFeedback360Options): Feedback360Submission[] {
  let list = loadSubmissions();
  if (options?.quarter) {
    list = list.filter((s) => s.quarterKey === options.quarter);
  }
  if (options?.month) {
    list = list.filter((s) => {
      const d = s.timestamp.slice(0, 7);
      return d === options.month;
    });
  }
  if (options?.subjectNamesAllowlist != null && options.subjectNamesAllowlist.length > 0) {
    const set = new Set(options.subjectNamesAllowlist);
    list = list.filter((s) => set.has(s.subjectName));
  }
  return list;
}
