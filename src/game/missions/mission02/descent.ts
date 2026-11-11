/**
 * Top-down powered descent — pure, deterministic simulation (metres, seconds).
 * Ground plane: +x = map-grid east, +y = map-grid south. Landing zone centre is (0, 0).
 * All values are simplified for gameplay (sim).
 */
export const DESCENT = {
  gravity: 1.62, // m/s², real lunar value
  engineAccel: 3.4, // m/s² at full throttle (sim)
  rcsAccel: 1.2, // m/s² sideways thrusters (sim)
  fuelMax: 100, // %
  engineBurn: 2.2, // % per second at full throttle (sim)
  rcsBurn: 0.7, // % per second while any thruster fires (sim)
  startAlt: 320,
  startVs: -14,
  start: { x: -95, y: 55, vx: 2.2, vy: -1.4 },
  maxVs: 2.0, // touchdown limit, m/s
  maxHs: 1.0, // sideways drift limit, m/s
  lzRadius: 18,
  boundary: 340,
  landerSize: 9,
  maxStep: 1 / 60,
} as const;

export interface DescentState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alt: number;
  /** Vertical speed, negative = descending. */
  vs: number;
  fuel: number;
  engine: boolean;
  rcsX: number;
  rcsY: number;
}

export interface DescentInput {
  thrust: boolean;
  /** −1..1 sideways thruster command. */
  rcsX: number;
  rcsY: number;
}

export function initialDescent(): DescentState {
  const s = DESCENT.start;
  return {
    t: 0,
    x: s.x,
    y: s.y,
    vx: s.vx,
    vy: s.vy,
    alt: DESCENT.startAlt,
    vs: DESCENT.startVs,
    fuel: DESCENT.fuelMax,
    engine: false,
    rcsX: 0,
    rcsY: 0,
  };
}

function stepOnce(s: DescentState, input: DescentInput, dt: number): DescentState {
  const hasFuel = s.fuel > 0;
  const engine = input.thrust && hasFuel;
  const mag = Math.hypot(input.rcsX, input.rcsY);
  const rx = hasFuel && mag > 0 ? input.rcsX / Math.max(1, mag) : 0;
  const ry = hasFuel && mag > 0 ? input.rcsY / Math.max(1, mag) : 0;
  const rcsOn = rx !== 0 || ry !== 0;

  const az = (engine ? DESCENT.engineAccel : 0) - DESCENT.gravity;
  const vs = s.vs + az * dt;
  const vx = s.vx + rx * DESCENT.rcsAccel * dt;
  const vy = s.vy + ry * DESCENT.rcsAccel * dt;
  const burn = (engine ? DESCENT.engineBurn : 0) + (rcsOn ? DESCENT.rcsBurn : 0);
  return {
    t: s.t + dt,
    x: s.x + vx * dt,
    y: s.y + vy * dt,
    vx,
    vy,
    alt: Math.max(0, s.alt + vs * dt),
    vs,
    fuel: Math.max(0, s.fuel - burn * dt),
    engine,
    rcsX: rx,
    rcsY: ry,
  };
}

/** Advance the simulation; large frames are split into small fixed steps. */
export function stepDescent(s: DescentState, input: DescentInput, dt: number): DescentState {
  let state = s;
  let left = Math.max(0, Math.min(dt, 0.25));
  while (left > 1e-9 && state.alt > 0) {
    const h = Math.min(DESCENT.maxStep, left);
    state = stepOnce(state, input, h);
    left -= h;
  }
  return state;
}

export const horizontalSpeed = (s: Pick<DescentState, "vx" | "vy">) => Math.hypot(s.vx, s.vy);
export const distanceToLz = (s: Pick<DescentState, "x" | "y">) => Math.hypot(s.x, s.y);
export const isOutOfBounds = (s: Pick<DescentState, "x" | "y">) => distanceToLz(s) > DESCENT.boundary;

// ------------------------------------------------------------------ terrain
export interface Circle {
  x: number;
  y: number;
  r: number;
}

/** Permanently shadowed crater south-east of the landing zone. */
export const PSR: Circle = { x: 240, y: 230, r: 150 };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildTerrain(seed = 2042): { boulders: Circle[]; craters: Circle[] } {
  const rand = mulberry32(seed);
  const craters: Circle[] = [];
  let guard = 0;
  while (craters.length < 28 && guard++ < 2000) {
    const c = { x: (rand() * 2 - 1) * 400, y: (rand() * 2 - 1) * 400, r: 6 + rand() * rand() * 38 };
    if (Math.hypot(c.x, c.y) - c.r < DESCENT.lzRadius + 8) continue;
    if (Math.hypot(c.x - PSR.x, c.y - PSR.y) < PSR.r + c.r) continue;
    if (craters.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < o.r + c.r)) continue;
    craters.push(c);
  }
  const boulders: Circle[] = [];
  guard = 0;
  while (boulders.length < 170 && guard++ < 5000) {
    // A ring of rocks just outside the zone keeps the final approach honest.
    const near = boulders.length < 40;
    const ang = rand() * Math.PI * 2;
    const dist = near ? DESCENT.lzRadius + 6 + rand() * 40 : 30 + rand() * 380;
    const b = { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, r: 0.8 + rand() * rand() * 3.2 };
    if (Math.hypot(b.x, b.y) < DESCENT.lzRadius + 4) continue;
    if (Math.hypot(b.x - PSR.x, b.y - PSR.y) < PSR.r) continue;
    boulders.push(b);
  }
  return { boulders, craters };
}

export const TERRAIN = buildTerrain();

// --------------------------------------------------------------- touchdown
export type TouchdownFailure = "hard" | "drift" | "boulder" | "crater" | "outside" | "lost";

export interface TouchdownResult {
  ok: boolean;
  reason: TouchdownFailure | null;
  distance: number;
  vs: number;
  hs: number;
  fuel: number;
  time: number;
}

export const FAILURE_TEXT: Record<TouchdownFailure, string> = {
  hard: `Descending too fast at contact (limit ${DESCENT.maxVs.toFixed(1)} m/s). Hold the engine longer near the ground.`,
  drift: `Sliding sideways at contact (limit ${DESCENT.maxHs.toFixed(1)} m/s). Cancel your drift with the thrusters before the last 30 m.`,
  boulder: "A landing leg would have hit a boulder. Stay inside the surveyed zone — it has been cleared of rocks.",
  crater: "Contact on a crater wall — too steep for the lander. Aim for the flat surveyed zone.",
  outside: "Touched down outside the surveyed landing zone. The ground there hasn't been checked for hazards.",
  lost: "Drifted too far from the landing zone to reach it with the remaining fuel.",
};

/** Final check at contact. Order = most important reason first. */
export function evaluateTouchdown(
  s: DescentState,
  terrain: { boulders: Circle[]; craters: Circle[] } = TERRAIN,
): TouchdownResult {
  const distance = distanceToLz(s);
  const hs = horizontalSpeed(s);
  const vs = Math.abs(s.vs);
  const base = { distance, vs, hs, fuel: s.fuel, time: s.t };
  const foot = DESCENT.landerSize / 2;
  let reason: TouchdownFailure | null = null;
  if (vs > DESCENT.maxVs) reason = "hard";
  else if (hs > DESCENT.maxHs) reason = "drift";
  else if (terrain.boulders.some((b) => Math.hypot(b.x - s.x, b.y - s.y) < b.r + foot * 0.7)) reason = "boulder";
  else if ([...terrain.craters, PSR].some((c) => Math.hypot(c.x - s.x, c.y - s.y) < c.r * 0.9)) reason = "crater";
  else if (distance > DESCENT.lzRadius) reason = "outside";
  return { ...base, ok: reason === null, reason };
}

export function lostResult(s: DescentState): TouchdownResult {
  return { ok: false, reason: "lost", distance: distanceToLz(s), vs: Math.abs(s.vs), hs: horizontalSpeed(s), fuel: s.fuel, time: s.t };
}
