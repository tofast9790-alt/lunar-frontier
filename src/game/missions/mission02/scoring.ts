import { DESCENT, type TouchdownResult } from "./descent";
import { SAFE_SITE, SUN_HEADING } from "./data";
import { COCKPIT_CHECK_IDS, NOTE_IDS, type CockpitCheckId, type Heading, type NoteId, type PanelTilt, type SiteId } from "./types";

export const POINTS = {
  perCockpitCheck: 60,
  siteBase: 150,
  siteWrongPenalty: 50,
  landingBase: 250,
  landingFailPenalty: 40,
  landingBaseFloor: 130,
  precisionMax: 100,
  softnessMax: 70,
  fuelMax: 80,
  /** Fuel left (%) that earns the full fuel bonus. */
  fuelFullAt: 40,
  beacon: 100,
  beaconFirstTry: 20,
  optional: 50,
} as const;

export const MAX_SCORE =
  POINTS.perCockpitCheck * COCKPIT_CHECK_IDS.length +
  POINTS.siteBase +
  POINTS.landingBase +
  POINTS.precisionMax +
  POINTS.softnessMax +
  POINTS.fuelMax +
  POINTS.beacon +
  POINTS.beaconFirstTry +
  POINTS.optional;

export const cockpitDone = (c: Record<CockpitCheckId, boolean>) => COCKPIT_CHECK_IDS.filter((id) => c[id]).length;
export const allCockpitDone = (c: Record<CockpitCheckId, boolean>) => cockpitDone(c) === COCKPIT_CHECK_IDS.length;

/** Site selection unlocks after every pre-descent check. */
export const canSelectSite = allCockpitDone;

export function isSafeSite(id: SiteId): boolean {
  return id === SAFE_SITE;
}

/** Descent needs all checks AND the safe site confirmed. */
export function canBeginDescent(c: Record<CockpitCheckId, boolean>, chosen: SiteId | null): boolean {
  return allCockpitDone(c) && chosen !== null && isSafeSite(chosen);
}

export function sitePoints(wrongPicks: number, chosen: SiteId | null): number {
  if (!chosen || !isSafeSite(chosen)) return 0;
  return Math.max(0, POINTS.siteBase - POINTS.siteWrongPenalty * wrongPicks);
}

export interface LandingPoints {
  base: number;
  precision: number;
  softness: number;
  fuel: number;
  total: number;
}

export function landingPoints(result: TouchdownResult | null, failedAttempts: number): LandingPoints {
  if (!result?.ok) return { base: 0, precision: 0, softness: 0, fuel: 0, total: 0 };
  const base = Math.max(POINTS.landingBaseFloor, POINTS.landingBase - POINTS.landingFailPenalty * failedAttempts);
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const precision = Math.round(POINTS.precisionMax * clamp01(1 - result.distance / DESCENT.lzRadius));
  const softness = Math.round(POINTS.softnessMax * clamp01(1 - result.vs / DESCENT.maxVs));
  const fuel = Math.round(POINTS.fuelMax * clamp01(result.fuel / POINTS.fuelFullAt));
  return { base, precision, softness, fuel, total: base + precision + softness + fuel };
}

/** Polar solar panels stand upright and face the Sun, which sits opposite the shadows. */
export function isBeaconAimCorrect(tilt: PanelTilt, heading: Heading): boolean {
  return tilt === "vertical" && heading === SUN_HEADING;
}

export function isOptionalComplete(notesRead: Record<NoteId, boolean>, sampleCollected: boolean): boolean {
  return sampleCollected && NOTE_IDS.every((id) => notesRead[id]);
}

/** Mission complete = landed + beacon deployed + reported. */
export function isMissionComplete(landed: boolean, beaconDeployed: boolean, reported: boolean): boolean {
  return landed && beaconDeployed && reported;
}

export interface ScoreBreakdown {
  cockpit: number;
  site: number;
  landing: LandingPoints;
  beacon: number;
  optional: number;
  total: number;
}

export function computeScore(input: {
  cockpit: Record<CockpitCheckId, boolean>;
  siteChosen: SiteId | null;
  siteWrongPicks: number;
  landing: TouchdownResult | null;
  failedLandings: number;
  beaconDeployed: boolean;
  beaconMistakes: number;
  optionalComplete: boolean;
}): ScoreBreakdown {
  const cockpit = cockpitDone(input.cockpit) * POINTS.perCockpitCheck;
  const site = sitePoints(input.siteWrongPicks, input.siteChosen);
  const landing = landingPoints(input.landing, input.failedLandings);
  const beacon = input.beaconDeployed ? POINTS.beacon + (input.beaconMistakes === 0 ? POINTS.beaconFirstTry : 0) : 0;
  const optional = input.optionalComplete ? POINTS.optional : 0;
  return { cockpit, site, landing, beacon, optional, total: cockpit + site + landing.total + beacon + optional };
}

export function rankFor(total: number): string {
  if (total >= 900) return "Commander Distinction";
  if (total >= 720) return "Mission Ready";
  return "Qualified";
}
