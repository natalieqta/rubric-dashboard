/**
 * Schema and types for coach performance dashboard.
 * No averages; distribution-only metrics.
 */

export const DIMENSION_KEYS = [
  "techMastery",
  "buildTrust",
  "resilientUnderPressure",
  "teamPlayer",
  "moveFast",
] as const;

export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  techMastery: "Tech Mastery",
  buildTrust: "Build Trust",
  resilientUnderPressure: "Resilient Under Pressure",
  teamPlayer: "Team Player",
  moveFast: "Move Fast",
};

/** Score 1-4 or null (N/A, empty, malformed) */
export type Score = 1 | 2 | 3 | 4 | null;

export const SCORE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Below Expectations",
  2: "Progressing",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
};

export interface ParsedScores {
  techMastery: Score;
  buildTrust: Score;
  resilientUnderPressure: Score;
  teamPlayer: Score;
  moveFast: Score;
}

export interface ParsedEvaluation {
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
}

/** One evaluation per (coach, developer, quarter) - latest in that quarter */
export interface DeveloperQuarterSnapshot {
  coachName: string;
  consultantName: string;
  quarterLabel: string;
  quarterKey: string;
  techMastery: Score;
  buildTrust: Score;
  resilientUnderPressure: Score;
  teamPlayer: Score;
  moveFast: Score;
  assertions: {
    techMastery: string;
    buildTrust: string;
    resilientUnderPressure: string;
    teamPlayer: string;
    moveFast: string;
  };
  summaryForBrainsNotes: string;
  evaluationTimestamp: Date;
}

export type RiskFlagType = "lowScore" | "declining" | "stagnant" | "dataGap";

export interface DeveloperRiskFlags {
  lowScore: DimensionKey[] | null;
  declining: DimensionKey[] | null;
  stagnant: DimensionKey[] | null;
  dataGap: DimensionKey[] | null;
}

export type TrendDirection = "up" | "down" | "flat";

export type UserRole = "Admin" | "Coach";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  coachName: string | null;
  createdAt: Date;
}
