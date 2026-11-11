import type { CockpitCheckId, Heading, NoteId, SiteId, SurfaceId } from "./types";

export const MISSION_ID = "m02";

export const MISSION_02 = {
  id: MISSION_ID,
  chapter: "Chapter 1 — The Arrival",
  code: "Mission 02",
  title: "Touchdown",
  story:
    "Three days after launch, your lander has separated from the transfer ship and is circling the Moon. Below you is the south polar region: grey, cratered and lit by a Sun that never climbs more than a few degrees above the horizon. Before the first outpost module can follow, someone has to land, survey the ground and plant a navigation beacon. That someone is you.",
  primaryObjective:
    "Complete three pre-descent checks, choose a safe landing site, land inside the surveyed zone, then deploy the navigation beacon and report to Mission Control.",
  optionalObjective: "Read all six Science Notes and collect a regolith sample from the crater rim.",
  targetDuration: "About 12–18 minutes.",
};

export const COCKPIT_TITLES: Record<CockpitCheckId, string> = {
  engine: "Descent Engine & Propellant",
  radar: "Landing Radar",
  guidance: "Guidance Star Alignment",
};

export interface SiteInfo {
  id: SiteId;
  letter: string;
  name: string;
  /** Position on the 2D orbital map (0–100). */
  mapX: number;
  mapY: number;
  slopeDeg: number;
  boulders: "low" | "medium" | "high";
  sunlightPct: number;
  iceKm: number | null;
  earthVisible: boolean;
  verdict: string;
}

export const SAFE_SITE: SiteId = "ridge";
/** Lander tilt limit used in the site data. */
export const MAX_SLOPE_DEG = 12;

export const SITES: Record<SiteId, SiteInfo> = {
  ridge: {
    id: "ridge",
    letter: "A",
    name: "Crater Rim Ridge",
    mapX: 40,
    mapY: 45,
    slopeDeg: 3,
    boulders: "low",
    sunlightPct: 85,
    iceKm: 2.5,
    earthVisible: true,
    verdict:
      "Good choice. Gentle slope, few boulders, sunlight most of the time for solar power, Earth in view for direct radio, and a shadowed ice crater only 2.5 km away.",
  },
  basin: {
    id: "basin",
    letter: "B",
    name: "Shadowed Crater Floor",
    mapX: 63,
    mapY: 62,
    slopeDeg: 1,
    boulders: "low",
    sunlightPct: 0,
    iceKm: 0,
    earthVisible: false,
    verdict:
      "Flat, and right on top of the ice — but this floor never sees the Sun. No solar power, temperatures far below −200 °C, and the crater walls block radio contact with Earth.",
  },
  plateau: {
    id: "plateau",
    letter: "C",
    name: "Boulder Plateau",
    mapX: 22,
    mapY: 70,
    slopeDeg: 6,
    boulders: "high",
    sunlightPct: 75,
    iceKm: 6,
    earthVisible: true,
    verdict:
      "Sunny and in contact with Earth, but the ground is covered in boulders. Landing a leg on a rock bigger than the lander's clearance could tip it over.",
  },
  slope: {
    id: "slope",
    letter: "D",
    name: "Far Rim Slope",
    mapX: 76,
    mapY: 26,
    slopeDeg: 17,
    boulders: "medium",
    sunlightPct: 60,
    iceKm: 4,
    earthVisible: false,
    verdict: `Too steep: 17° is beyond the lander's ${MAX_SLOPE_DEG}° tilt limit, and the ridge hides Earth, so there's no direct radio link.`,
  },
};

export interface ScienceNoteInfo {
  title: string;
  body: string;
  simplified?: string;
}

export const SCIENCE_NOTES: Record<NoteId, ScienceNoteInfo> = {
  engine: {
    title: "No air, no parachutes",
    body: "The Moon has almost no atmosphere, so parachutes and wings are useless. The only way to slow down is to fire the engine against your fall. Lunar gravity is about 1.62 m/s² — one-sixth of Earth's — but it never stops pulling, so every second you hover costs fuel.",
  },
  radar: {
    title: "Measuring height with echoes",
    body: "A landing radar sends out a radio pulse and times how long the echo takes to come back from the ground. Radio travels at the speed of light, about 300,000 km/s, so the distance is (speed × time) ÷ 2 — divided by two because the pulse travels down and back up.",
    simplified: "Real radars send many pulses per second and also measure your speed from the echo's change in frequency.",
  },
  guidance: {
    title: "Navigating by the stars",
    body: "There is no GPS network around the Moon yet. Spacecraft work out which way they are pointing with star trackers: small cameras that photograph the sky and match the star pattern against a catalogue. Small errors grow over time, so the guidance system is re-aligned before critical moves like a landing.",
  },
  site: {
    title: "Why the south pole?",
    body: "The Moon's axis is only tilted about 1.5°, so near the poles the Sun always stays close to the horizon. Some crater floors never see sunlight at all and stay cold enough to trap water ice for billions of years. Nearby ridges can be sunlit most of the time — ideal for solar power, close to the ice.",
    simplified: "Sunlight percentages and distances on the site map are simplified for gameplay.",
  },
  beacon: {
    title: "Solar power with a low Sun",
    body: "At the lunar poles the Sun skims along the horizon instead of passing overhead, slowly circling the sky about once every 29.5 days. A flat solar panel would catch almost nothing, so polar panels stand upright and turn to follow the Sun around the horizon. Long shadows always point away from the Sun.",
  },
  ice: {
    title: "Ice in the dark",
    body: "Permanently shadowed craters near the poles are among the coldest places measured in the Solar System. Spacecraft data suggest some contain water ice mixed into the soil (regolith). Water could one day be used for drinking, growing food, or split into hydrogen and oxygen for air and rocket fuel.",
  },
};

/** Surface walk layout (world pixels). */
export const SURFACE = {
  width: 1800,
  height: 1200,
  lander: { x: 640, y: 520 },
  playerStart: { x: 640, y: 700 },
  crater: { x: 1400, y: 1180, r: 360 },
};

export interface SurfacePoint {
  id: SurfaceId;
  label: string;
  verb: string;
  x: number;
  y: number;
}

export const SURFACE_POINTS: Record<SurfaceId, SurfacePoint> = {
  beacon: { id: "beacon", label: "Beacon site", verb: "Deploy beacon", x: 1180, y: 430 },
  sample: { id: "sample", label: "Crater rim", verb: "Collect sample", x: 1130, y: 880 },
  lander: { id: "lander", label: "Lander ladder", verb: "Report to Mission Control", x: 640, y: 655 },
};

/** Where the Sun is on the map grid — shadows point the opposite way. */
export const SUN_HEADING: Heading = "west";
