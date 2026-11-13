import { createStore, useStore } from "@/game/core/store";
import { recordMissionResult } from "@/game/persistence/save";
import { MISSION_ID, SAFE_SITE } from "./data";
import { LINES, SITE_FEEDBACK_ELENA, failLine } from "./dialogue";
import { distanceToLz, horizontalSpeed, type DescentState, type TouchdownResult } from "./descent";
import {
  allCockpitDone,
  canBeginDescent,
  canSelectSite,
  computeScore,
  isBeaconAimCorrect,
  isOptionalComplete,
  type ScoreBreakdown,
} from "./scoring";
import {
  COCKPIT_CHECK_IDS,
  NOTE_IDS,
  type CockpitCheckId,
  type DialogueLine,
  type Heading,
  type NoteId,
  type PanelTilt,
  type SiteId,
  type SurfaceId,
} from "./types";

export type Phase = "intro" | "briefing" | "cockpit" | "site" | "descent" | "surface" | "evaluation" | "complete";

export type Overlay = null | { kind: "pause" } | { kind: "ares" } | { kind: "surface"; id: SurfaceId };

export type DescentStatus = "ready" | "flying" | "landed" | "failed";

export interface Telemetry {
  alt: number;
  vs: number;
  hs: number;
  fuel: number;
  distance: number;
  /** Bearing from lander to the landing zone, radians (0 = east, screen coords). */
  bearing: number;
  engine: boolean;
  t: number;
}

export interface M02Result {
  score: ScoreBreakdown;
  isNewBest: boolean;
  previousBest: number;
}

export interface M02State {
  runId: number;
  phase: Phase;
  cockpit: Record<CockpitCheckId, boolean>;
  notesRead: Record<NoteId, boolean>;
  site: { chosen: SiteId | null; wrongPicks: number; rejected: SiteId[] };
  descent: {
    attempt: number;
    status: DescentStatus;
    telemetry: Telemetry | null;
    lastResult: TouchdownResult | null;
    failures: number;
    landing: TouchdownResult | null;
    callout: string | null;
  };
  beacon: { deployed: boolean; mistakes: number };
  sampleCollected: boolean;
  reported: boolean;
  overlay: Overlay;
  nearby: SurfaceId | null;
  commsQueue: DialogueLine[];
  commsLog: DialogueLine[];
  spokenIds: string[];
  result: M02Result | null;
}

const noCockpit = (): Record<CockpitCheckId, boolean> =>
  Object.fromEntries(COCKPIT_CHECK_IDS.map((id) => [id, false])) as Record<CockpitCheckId, boolean>;
const noNotes = (): Record<NoteId, boolean> =>
  Object.fromEntries(NOTE_IDS.map((id) => [id, false])) as Record<NoteId, boolean>;

export function initialM02State(runId = 0, phase: Phase = "intro"): M02State {
  return {
    runId,
    phase,
    cockpit: noCockpit(),
    notesRead: noNotes(),
    site: { chosen: null, wrongPicks: 0, rejected: [] },
    descent: { attempt: 0, status: "ready", telemetry: null, lastResult: null, failures: 0, landing: null, callout: null },
    beacon: { deployed: false, mistakes: 0 },
    sampleCollected: false,
    reported: false,
    overlay: null,
    nearby: null,
    commsQueue: [],
    commsLog: [],
    spokenIds: [],
    result: null,
  };
}

export const m02Store = createStore<M02State>(initialM02State());
export const useM02 = () => useStore(m02Store);

// ------------------------------------------------------------------ comms
export function say(line: DialogueLine) {
  const s = m02Store.get();
  if (s.spokenIds.includes(line.id)) return;
  m02Store.set({
    spokenIds: [...s.spokenIds, line.id],
    commsQueue: [...s.commsQueue, line],
    commsLog: [...s.commsLog, line].slice(-30),
  });
}

export function sayAgain(line: Omit<DialogueLine, "id">) {
  const s = m02Store.get();
  const l = { ...line, id: `${line.speaker}-${s.commsLog.length}-${Date.now()}` };
  m02Store.set({ commsQueue: [...s.commsQueue, l].slice(-4), commsLog: [...s.commsLog, l].slice(-30) });
}

export function advanceComms() {
  m02Store.set((s) => ({ commsQueue: s.commsQueue.slice(1) }));
}

// ------------------------------------------------------------------ flow
export function startMission02(phase: Phase = "intro") {
  const prev = m02Store.get();
  m02Store.replace(initialM02State(prev.runId + 1, phase));
}

export function setPhase(phase: Phase) {
  const s = m02Store.get();
  // Guard the gates so no screen can skip a required step.
  if (phase === "site" && !canSelectSite(s.cockpit)) return;
  if (phase === "descent" && !canBeginDescent(s.cockpit, s.site.chosen)) return;
  if (phase === "surface" && !s.descent.landing) return;
  // Unread chatter from the previous step stays in the log but leaves the live panel.
  m02Store.set({ phase, overlay: null, nearby: null, commsQueue: [] });
  if (phase === "cockpit") {
    say(LINES.cockpitStart);
    say(LINES.aresCockpit);
  }
  if (phase === "descent") say(LINES.descentStart);
  if (phase === "surface") {
    say(LINES.surfaceStart);
    say(LINES.aresSurface);
  }
  if (phase === "evaluation") say(LINES.evaluation);
}

export function openOverlay(overlay: Exclude<Overlay, null>) {
  m02Store.set({ overlay });
}

export function closeOverlay() {
  m02Store.set({ overlay: null });
}

export function setNearby(id: SurfaceId | null) {
  if (m02Store.get().nearby !== id) m02Store.set({ nearby: id });
}

/** Returns true only the first time (no duplicate rewards). */
export function completeCockpitCheck(id: CockpitCheckId): boolean {
  const s = m02Store.get();
  if (s.cockpit[id]) return false;
  const cockpit = { ...s.cockpit, [id]: true };
  m02Store.set({ cockpit });
  if (allCockpitDone(cockpit)) say(LINES.cockpitDone);
  return true;
}

function maybeOptional() {
  const s = m02Store.get();
  if (isOptionalComplete(s.notesRead, s.sampleCollected)) say(LINES.optionalDone);
}

export function markNoteRead(id: NoteId) {
  const s = m02Store.get();
  if (s.notesRead[id]) return;
  m02Store.set({ notesRead: { ...s.notesRead, [id]: true } });
  maybeOptional();
}

/** Each wrong site costs points once; the safe site locks in the choice. */
export function pickSite(id: SiteId): boolean {
  const s = m02Store.get();
  if (!canSelectSite(s.cockpit) || s.site.chosen) return s.site.chosen === id;
  if (id === SAFE_SITE) {
    m02Store.set({ site: { ...s.site, chosen: id } });
    say(LINES.siteGood);
    return true;
  }
  if (!s.site.rejected.includes(id)) {
    m02Store.set({ site: { ...s.site, wrongPicks: s.site.wrongPicks + 1, rejected: [...s.site.rejected, id] } });
    sayAgain({ speaker: "elena", text: SITE_FEEDBACK_ELENA });
  }
  return false;
}

// ---------------------------------------------------------------- descent
export function beginDescent() {
  const s = m02Store.get();
  if (s.phase !== "descent" || s.descent.status !== "ready") return;
  m02Store.set({ descent: { ...s.descent, status: "flying", callout: "Powered descent initiated" } });
}

export function toTelemetry(d: DescentState): Telemetry {
  return {
    alt: d.alt,
    vs: d.vs,
    hs: horizontalSpeed(d),
    fuel: d.fuel,
    distance: distanceToLz(d),
    bearing: Math.atan2(-d.y, -d.x),
    engine: d.engine,
    t: d.t,
  };
}

export function updateTelemetry(d: DescentState) {
  const s = m02Store.get();
  m02Store.set({ descent: { ...s.descent, telemetry: toTelemetry(d) } });
}

export function setCallout(text: string) {
  const s = m02Store.get();
  if (s.descent.callout !== text) m02Store.set({ descent: { ...s.descent, callout: text } });
}

/** Records the outcome of one descent attempt (only while flying). */
export function resolveTouchdown(result: TouchdownResult, d?: DescentState) {
  const s = m02Store.get();
  if (s.descent.status !== "flying") return;
  const telemetry = d ? toTelemetry(d) : s.descent.telemetry;
  if (result.ok) {
    m02Store.set({ descent: { ...s.descent, status: "landed", lastResult: result, landing: result, telemetry, callout: "Contact light. Engine stop." } });
    say(LINES.landed);
  } else {
    m02Store.set({
      descent: { ...s.descent, status: "failed", lastResult: result, failures: s.descent.failures + 1, telemetry, callout: "ABORT — ascent to orbit" },
    });
    sayAgain(failLine(s.descent.failures + 1));
  }
}

export function retryDescent() {
  const s = m02Store.get();
  if (s.descent.status !== "failed") return;
  m02Store.set({
    descent: { ...s.descent, attempt: s.descent.attempt + 1, status: "ready", telemetry: null, lastResult: null, callout: null },
  });
}

// ---------------------------------------------------------------- surface
/** Returns whether the aim was right; a wrong aim counts as a mistake and does not deploy. */
export function tryDeployBeacon(tilt: PanelTilt, heading: Heading): boolean {
  const s = m02Store.get();
  if (s.beacon.deployed) return true;
  if (!isBeaconAimCorrect(tilt, heading)) {
    m02Store.set({ beacon: { ...s.beacon, mistakes: s.beacon.mistakes + 1 } });
    return false;
  }
  m02Store.set({ beacon: { ...s.beacon, deployed: true } });
  say(LINES.beaconDone);
  return true;
}

export function collectSample() {
  if (m02Store.get().sampleCollected) return;
  m02Store.set({ sampleCollected: true });
  say(LINES.sampleDone);
  maybeOptional();
}

export function warnCrater() {
  say(LINES.craterWarning);
}

export function reportToControl() {
  const s = m02Store.get();
  if (!s.beacon.deployed || !s.descent.landing) return;
  m02Store.set({ reported: true });
  setPhase("evaluation");
}

export function currentScore(s: M02State = m02Store.get()): ScoreBreakdown {
  return computeScore({
    cockpit: s.cockpit,
    siteChosen: s.site.chosen,
    siteWrongPicks: s.site.wrongPicks,
    landing: s.descent.landing,
    failedLandings: s.descent.failures,
    beaconDeployed: s.beacon.deployed,
    beaconMistakes: s.beacon.mistakes,
    optionalComplete: isOptionalComplete(s.notesRead, s.sampleCollected),
  });
}

/** Saves the run once. Safe to call repeatedly. */
export function finalizeMission02(): M02Result | null {
  const s = m02Store.get();
  if (s.result) return s.result;
  if (!s.reported) return null;
  const score = currentScore(s);
  const { isNewBest, previousBest } = recordMissionResult(MISSION_ID, score.total);
  const result = { score, isNewBest, previousBest };
  m02Store.set({ result });
  return result;
}
