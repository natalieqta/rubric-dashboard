/**
 * 360° feedback storage and listing. Single source: data/feedback-360.json.
 * Used by merge layer (lib/evaluations.ts) and feedback API.
 */

import feedback360Data from "@/data/feedback-360.json";
import type { Feedback360Submission } from "./schema";

function loadSubmissions(): Feedback360Submission[] {
  const data = feedback360Data as unknown;
  return Array.isArray(data) ? (data as Feedback360Submission[]) : [];
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
