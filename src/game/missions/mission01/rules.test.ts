import { beforeEach, describe, expect, it } from "vitest";
import { drawQuiz, isQuizPass, QUIZ_LENGTH } from "./quiz";
import { EMPTY_QUIZ, MAX_SCORE, applyQuizAttempt, computeScore, isLaunchAuthorized } from "./scoring";
import { completeCheck, currentScore, finalizeMission, missionStore, startMission } from "./state";
import { saveStore, recordMissionResult, resetSave, SAVE_KEY } from "@/game/persistence/save";
import { MISSIONS, missionRecordState } from "@/game/missions/registry";

const ALL = { suit: true, oxygen: true, comms: true, emergency: true };

describe("Mission 01 rules", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSave();
    startMission("training");
  });

  it("quiz passes with at least 2 of 3 correct", () => {
    expect(QUIZ_LENGTH).toBe(3);
    expect(isQuizPass(1)).toBe(false);
    expect(isQuizPass(2)).toBe(true);
    expect(isQuizPass(3)).toBe(true);
  });

  it("each quiz attempt draws 3 different questions", () => {
    const q = drawQuiz(() => 0.5);
    expect(q).toHaveLength(3);
    expect(new Set(q.map((x) => x.id)).size).toBe(3);
  });

  it("launch needs all four checks AND a quiz pass", () => {
    const passed = applyQuizAttempt(EMPTY_QUIZ, 2);
    expect(isLaunchAuthorized(ALL, EMPTY_QUIZ)).toBe(false);
    expect(isLaunchAuthorized({ ...ALL, comms: false }, passed)).toBe(false);
    expect(isLaunchAuthorized(ALL, passed)).toBe(true);
  });

  it("a failed quiz can be retried and a later pass counts", () => {
    const failed = applyQuizAttempt(EMPTY_QUIZ, 1);
    expect(failed.passed).toBe(false);
    const retried = applyQuizAttempt(failed, 3);
    expect(retried.passed).toBe(true);
    expect(retried.attempts).toBe(2);
    expect(retried.firstAttemptPassed).toBe(false);
  });

  it("completing the same check twice gives no extra progress or points", () => {
    expect(completeCheck("suit")).toBe(true);
    const after = currentScore().total;
    expect(completeCheck("suit")).toBe(false);
    expect(currentScore().total).toBe(after);
    expect(after).toBe(150);
  });

  it("perfect run scores the maximum of 1000", () => {
    const quiz = applyQuizAttempt(EMPTY_QUIZ, 3);
    expect(computeScore({ checks: ALL, quiz, optionalComplete: true }).total).toBe(1000);
    expect(MAX_SCORE).toBe(1000);
  });

  it("saves completion once per run and best score never drops", () => {
    for (const id of ["suit", "oxygen", "comms", "emergency"] as const) completeCheck(id);
    missionStore.set({ quiz: applyQuizAttempt(EMPTY_QUIZ, 2) });
    const r1 = finalizeMission();
    finalizeMission();
    expect(saveStore.get().missions["m01"]?.timesCompleted).toBe(1);
    expect(saveStore.get().missions["m01"]?.bestScore).toBe(r1.score.total);
    recordMissionResult("m01", 100);
    expect(saveStore.get().missions["m01"]?.bestScore).toBe(r1.score.total);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!).missions.m01.completed).toBe(true);
  });

  it("records show Mission 01 unlocked, then completed; Mission 02 stays locked", () => {
    const m01 = MISSIONS[0]!;
    const m02 = MISSIONS[1]!;
    expect(missionRecordState(m01, {})).toBe("unlocked");
    expect(missionRecordState(m01, { m01: true })).toBe("completed");
    expect(missionRecordState(m02, { m01: true })).toBe("locked");
  });

  it("reset save clears mission progress", () => {
    recordMissionResult("m01", 500);
    resetSave();
    expect(saveStore.get().missions).toEqual({});
  });
});
