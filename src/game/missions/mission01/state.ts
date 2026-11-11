import { createStore, useStore } from "@/game/core/store";
import { recordMissionResult } from "@/game/persistence/save";
import { MISSION_ID } from "./data";
import { LINES, checkReaction } from "./dialogue";
import {
  EMPTY_QUIZ,
  allChecksDone,
  applyQuizAttempt,
  checksDone,
  computeScore,
  isOptionalComplete,
  type QuizProgress,
  type ScoreBreakdown,
} from "./scoring";
import type { DialogueLine, InteractableId, StationId } from "./types";

export type Phase = "intro" | "briefing" | "training" | "evaluation" | "launch" | "complete";

export type Overlay =
  | null
  | { kind: "station"; id: InteractableId }
  | { kind: "quiz" }
  | { kind: "ares" }
  | { kind: "pause" };

export interface MissionResult {
  score: ScoreBreakdown;
  isNewBest: boolean;
  previousBest: number;
}

export interface MissionState {
  runId: number;
  phase: Phase;
  checks: Record<StationId, boolean>;
  notesRead: Record<StationId, boolean>;
  boardInspected: boolean;
  quiz: QuizProgress;
  overlay: Overlay;
  nearby: InteractableId | null;
  commsQueue: DialogueLine[];
  commsLog: DialogueLine[];
  spokenIds: string[];
  result: MissionResult | null;
}

const NO_STATIONS: Record<StationId, boolean> = { suit: false, oxygen: false, comms: false, emergency: false };

export function initialMissionState(runId = 0, phase: Phase = "intro"): MissionState {
  return {
    runId,
    phase,
    checks: { ...NO_STATIONS },
    notesRead: { ...NO_STATIONS },
    boardInspected: false,
    quiz: { ...EMPTY_QUIZ },
    overlay: null,
    nearby: null,
    commsQueue: [],
    commsLog: [],
    spokenIds: [],
    result: null,
  };
}

export const missionStore = createStore<MissionState>(initialMissionState());

export const useMission = () => useStore(missionStore);

/** Queue a comms line; each id plays at most once per run. */
export function say(line: DialogueLine) {
  const s = missionStore.get();
  if (s.spokenIds.includes(line.id)) return;
  missionStore.set({
    spokenIds: [...s.spokenIds, line.id],
    commsQueue: [...s.commsQueue, line],
    commsLog: [...s.commsLog, line].slice(-30),
  });
}

/** Ad-hoc line that may repeat (e.g. ARES hints). */
export function sayAgain(line: Omit<DialogueLine, "id">) {
  const s = missionStore.get();
  const l = { ...line, id: `${line.speaker}-${s.commsLog.length}-${Date.now()}` };
  missionStore.set({ commsQueue: [...s.commsQueue, l].slice(-4), commsLog: [...s.commsLog, l].slice(-30) });
}

export function advanceComms() {
  missionStore.set((s) => ({ commsQueue: s.commsQueue.slice(1) }));
}

export function startMission(phase: Phase = "intro") {
  const prev = missionStore.get();
  missionStore.replace(initialMissionState(prev.runId + 1, phase));
}

export function setPhase(phase: Phase) {
  missionStore.set({ phase, overlay: null, nearby: phase === "training" ? missionStore.get().nearby : null });
  if (phase === "training") {
    say(LINES.trainingStart);
    say(LINES.aresStart);
  }
  if (phase === "evaluation") say(LINES.evaluation);
}

export function openOverlay(overlay: Exclude<Overlay, null>) {
  missionStore.set({ overlay });
}

export function closeOverlay() {
  missionStore.set({ overlay: null });
}

export function setNearby(id: InteractableId | null) {
  if (missionStore.get().nearby !== id) missionStore.set({ nearby: id });
}

/** Marks an equipment check complete. Returns true only the first time (no duplicate rewards). */
export function completeCheck(id: StationId): boolean {
  const s = missionStore.get();
  if (s.checks[id]) return false;
  const checks = { ...s.checks, [id]: true };
  missionStore.set({ checks });
  say(checkReaction(id, checksDone(checks)));
  if (allChecksDone(checks)) say(LINES.allChecks);
  return true;
}

function maybeOptional() {
  const s = missionStore.get();
  if (isOptionalComplete(s.notesRead, s.boardInspected)) say(LINES.optionalDone);
}

export function markNoteRead(id: StationId) {
  const s = missionStore.get();
  if (s.notesRead[id]) return;
  missionStore.set({ notesRead: { ...s.notesRead, [id]: true } });
  maybeOptional();
}

export function inspectBoard() {
  if (missionStore.get().boardInspected) return;
  missionStore.set({ boardInspected: true });
  maybeOptional();
}

export function recordQuizAttempt(correct: number) {
  const s = missionStore.get();
  const quiz = applyQuizAttempt(s.quiz, correct);
  missionStore.set({ quiz });
  if (correct >= 2) say(LINES.quizPass);
  else sayAgain({ speaker: "elena", text: LINES.quizFail.text });
}

export function currentScore(s: MissionState = missionStore.get()): ScoreBreakdown {
  return computeScore({
    checks: s.checks,
    quiz: s.quiz,
    optionalComplete: isOptionalComplete(s.notesRead, s.boardInspected),
  });
}

/** Saves the run once (on launch). Safe to call repeatedly. */
export function finalizeMission(): MissionResult {
  const s = missionStore.get();
  if (s.result) return s.result;
  const score = currentScore(s);
  const { isNewBest, previousBest } = recordMissionResult(MISSION_ID, score.total);
  const result = { score, isNewBest, previousBest };
  missionStore.set({ result });
  return result;
}
