import { isQuizPass, QUIZ_LENGTH } from "./quiz";
import { STATION_IDS, type StationId } from "./types";

export interface QuizProgress {
  attempts: number;
  bestCorrect: number;
  lastCorrect: number | null;
  passed: boolean;
  firstAttemptPassed: boolean;
}

export const EMPTY_QUIZ: QuizProgress = {
  attempts: 0,
  bestCorrect: 0,
  lastCorrect: null,
  passed: false,
  firstAttemptPassed: false,
};

export const POINTS = {
  perCheck: 150,
  perQuizAnswer: 80,
  firstTryBonus: 60,
  optional: 100,
} as const;

export const MAX_SCORE =
  POINTS.perCheck * STATION_IDS.length + POINTS.perQuizAnswer * QUIZ_LENGTH + POINTS.firstTryBonus + POINTS.optional;

export function checksDone(checks: Record<StationId, boolean>): number {
  return STATION_IDS.filter((id) => checks[id]).length;
}

export function allChecksDone(checks: Record<StationId, boolean>): boolean {
  return checksDone(checks) === STATION_IDS.length;
}

export function isOptionalComplete(notesRead: Record<StationId, boolean>, boardInspected: boolean): boolean {
  return boardInspected && STATION_IDS.every((id) => notesRead[id]);
}

export function isLaunchAuthorized(checks: Record<StationId, boolean>, quiz: QuizProgress): boolean {
  return allChecksDone(checks) && quiz.passed;
}

export function applyQuizAttempt(quiz: QuizProgress, correct: number): QuizProgress {
  const passedNow = isQuizPass(correct);
  return {
    attempts: quiz.attempts + 1,
    bestCorrect: Math.max(quiz.bestCorrect, correct),
    lastCorrect: correct,
    passed: quiz.passed || passedNow,
    firstAttemptPassed: quiz.attempts === 0 ? passedNow : quiz.firstAttemptPassed,
  };
}

export interface ScoreBreakdown {
  checks: number;
  quiz: number;
  firstTry: number;
  optional: number;
  total: number;
}

export function computeScore(input: {
  checks: Record<StationId, boolean>;
  quiz: QuizProgress;
  optionalComplete: boolean;
}): ScoreBreakdown {
  const checks = checksDone(input.checks) * POINTS.perCheck;
  const quiz = input.quiz.bestCorrect * POINTS.perQuizAnswer;
  const firstTry = input.quiz.firstAttemptPassed ? POINTS.firstTryBonus : 0;
  const optional = input.optionalComplete ? POINTS.optional : 0;
  return { checks, quiz, firstTry, optional, total: checks + quiz + firstTry + optional };
}

export function rankFor(total: number): string {
  if (total >= 900) return "Commander Distinction";
  if (total >= 760) return "Mission Ready";
  return "Qualified";
}
