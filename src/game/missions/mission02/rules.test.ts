import { beforeEach, describe, expect, it } from "vitest";
import { DESCENT, PSR, TERRAIN, evaluateTouchdown, initialDescent, stepDescent, type DescentState } from "./descent";
import { MAX_SCORE, POINTS, canBeginDescent, isBeaconAimCorrect, landingPoints, sitePoints } from "./scoring";
import {
  beginDescent,
  completeCockpitCheck,
  currentScore,
  finalizeMission02,
  m02Store,
  pickSite,
  reportToControl,
  resolveTouchdown,
  retryDescent,
  setPhase,
  startMission02,
  tryDeployBeacon,
} from "./state";
import { resetSave, saveStore } from "@/game/persistence/save";

const ALL = { engine: true, radar: true, guidance: true };

/** A careful pilot: brakes to a gentle profile and steers toward the zone. */
function autopilot(s: DescentState) {
  const targetVs = -Math.min(14, 1.0 + s.alt * 0.06);
  const want = (p: number) => Math.max(-5, Math.min(5, -p * 0.15));
  const dx = want(s.x) - s.vx;
  const dy = want(s.y) - s.vy;
  return {
    thrust: s.vs < targetVs,
    rcsX: Math.abs(dx) > 0.15 ? Math.sign(dx) : 0,
    rcsY: Math.abs(dy) > 0.15 ? Math.sign(dy) : 0,
  };
}

function fly(pilot: (s: DescentState) => { thrust: boolean; rcsX: number; rcsY: number }) {
  let s = initialDescent();
  for (let i = 0; i < 60 * 300 && s.alt > 0; i++) s = stepDescent(s, pilot(s), 1 / 60);
  return s;
}

describe("Mission 02 descent physics", () => {
  it("uses real lunar gravity: free fall gains 1.62 m/s per second", () => {
    let s = initialDescent();
    for (let i = 0; i < 4; i++) s = stepDescent(s, { thrust: false, rcsX: 0, rcsY: 0 }, 0.25);
    expect(s.vs).toBeCloseTo(DESCENT.startVs - 1.62, 5);
    expect(s.fuel).toBe(100);
  });

  it("an empty tank means no engine", () => {
    const s = stepDescent({ ...initialDescent(), fuel: 0 }, { thrust: true, rcsX: 1, rcsY: 0 }, 0.5);
    expect(s.engine).toBe(false);
    expect(s.vx).toBeCloseTo(DESCENT.start.vx, 5);
  });

  it("a careful pilot can land safely with fuel to spare", () => {
    const s = fly(autopilot);
    const r = evaluateTouchdown(s);
    expect(r.ok).toBe(true);
    expect(r.fuel).toBeGreaterThan(20);
  });

  it("never touching the engine is a hard-landing abort", () => {
    const r = evaluateTouchdown(fly(() => ({ thrust: false, rcsX: 0, rcsY: 0 })));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("hard");
  });

  it("touchdown limits: 2.0 m/s down, 1.0 m/s sideways, inside the 18 m zone", () => {
    const at = (p: Partial<DescentState>) => evaluateTouchdown({ ...initialDescent(), x: 0, y: 0, vx: 0, vy: 0, alt: 0, ...p });
    expect(at({ vs: -1.9 }).ok).toBe(true);
    expect(at({ vs: -2.1 }).reason).toBe("hard");
    expect(at({ vs: -1, vx: 1.1 }).reason).toBe("drift");
    expect(at({ vs: -1, vx: 0.9 }).ok).toBe(true);
    expect(at({ vs: -1, x: 17 }).ok).toBe(true);
    expect(at({ vs: -1, x: PSR.x, y: PSR.y }).reason).toBe("crater");
  });

  it("the landing zone is clear of boulders and craters", () => {
    for (const b of TERRAIN.boulders) expect(Math.hypot(b.x, b.y)).toBeGreaterThan(DESCENT.lzRadius);
    for (const c of TERRAIN.craters) expect(Math.hypot(c.x, c.y) - c.r).toBeGreaterThan(DESCENT.lzRadius);
  });
});

describe("Mission 02 rules", () => {
  beforeEach(() => {
    localStorage.clear();
    resetSave();
    startMission02("cockpit");
  });

  it("descent needs all three checks AND the safe site", () => {
    expect(canBeginDescent(ALL, null)).toBe(false);
    expect(canBeginDescent(ALL, "basin")).toBe(false);
    expect(canBeginDescent({ ...ALL, radar: false }, "ridge")).toBe(false);
    expect(canBeginDescent(ALL, "ridge")).toBe(true);
  });

  it("site picks are locked until checks are done, and each wrong site costs 50 once", () => {
    expect(pickSite("ridge")).toBe(false);
    for (const id of ["engine", "radar", "guidance"] as const) completeCockpitCheck(id);
    expect(pickSite("basin")).toBe(false);
    pickSite("basin");
    expect(m02Store.get().site.wrongPicks).toBe(1);
    expect(pickSite("ridge")).toBe(true);
    expect(sitePoints(1, "ridge")).toBe(100);
    expect(sitePoints(5, "ridge")).toBe(0);
  });

  it("cannot skip to descent or the surface before earning it", () => {
    setPhase("descent");
    expect(m02Store.get().phase).toBe("cockpit");
    setPhase("surface");
    expect(m02Store.get().phase).toBe("cockpit");
  });

  it("a failed descent can be retried; each failure lowers the landing base by 40", () => {
    const perfect = { ok: true, reason: null, distance: 0, vs: 0, hs: 0, fuel: 40, time: 60 };
    expect(landingPoints(perfect, 0).total).toBe(500);
    expect(landingPoints(perfect, 1).base).toBe(210);
    expect(landingPoints(perfect, 10).base).toBe(POINTS.landingBaseFloor);
  });

  it("beacon panel must stand vertical and face the Sun (west, opposite the shadows)", () => {
    expect(isBeaconAimCorrect("vertical", "west")).toBe(true);
    expect(isBeaconAimCorrect("flat", "west")).toBe(false);
    expect(isBeaconAimCorrect("vertical", "east")).toBe(false);
  });

  it("perfect run scores the maximum of 1000 and is saved once", () => {
    expect(MAX_SCORE).toBe(1000);
    for (const id of ["engine", "radar", "guidance"] as const) completeCockpitCheck(id);
    pickSite("ridge");
    setPhase("descent");
    beginDescent();
    resolveTouchdown({ ok: false, reason: "hard", distance: 3, vs: 4, hs: 0, fuel: 20, time: 30 });
    retryDescent();
    beginDescent();
    resolveTouchdown({ ok: true, reason: null, distance: 0, vs: 0, hs: 0, fuel: 50, time: 60 });
    setPhase("surface");
    expect(tryDeployBeacon("vertical", "west")).toBe(true);
    reportToControl();
    expect(m02Store.get().phase).toBe("evaluation");
    // One failed landing: 1000 − 40 − 50 optional not done.
    expect(currentScore().total).toBe(1000 - 40 - POINTS.optional);
    finalizeMission02();
    finalizeMission02();
    expect(saveStore.get().missions["m02"]?.timesCompleted).toBe(1);
  });
});
