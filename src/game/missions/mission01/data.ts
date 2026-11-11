import type { InteractableId, StationId } from "./types";

export const MISSION_ID = "m01";

export const MISSION_01 = {
  id: MISSION_ID,
  chapter: "Chapter 1 — The Arrival",
  code: "Mission 01",
  title: "The Selection",
  story:
    "It is 2042. The international Lunar Frontier programme is preparing a sustainable research outpost near the Moon's south polar region. You have been selected as mission commander. Before launch, you must prove you understand the equipment that will keep you alive.",
  primaryObjective:
    "Complete all four equipment inspections in the Prep Bay, then pass the certification quiz (at least 2 of 3 correct) to earn launch authorization.",
  optionalObjective:
    "Read all four Science Notes and acknowledge the Mission Checklist board on the north wall.",
  targetDuration: "Prototype slice: about 8–12 minutes. The full mission is planned at 15–25 minutes.",
};

export interface StationInfo {
  id: InteractableId;
  label: string;
  short: string;
  verb: string;
  /** Interaction anchor in world pixels. */
  x: number;
  y: number;
}

export const INTERACTABLES: Record<InteractableId, StationInfo> = {
  suit: { id: "suit", label: "Suit Integrity Station", short: "Suit", verb: "Inspect suit", x: 210, y: 250 },
  oxygen: { id: "oxygen", label: "Oxygen System Rack", short: "Oxygen", verb: "Check oxygen", x: 1070, y: 250 },
  comms: { id: "comms", label: "Comms Console", short: "Comms", verb: "Test radio", x: 210, y: 610 },
  emergency: { id: "emergency", label: "Emergency Kit Locker", short: "Emergency", verb: "Inspect kit", x: 1010, y: 640 },
  board: { id: "board", label: "Mission Checklist Board", short: "Checklist", verb: "Read board", x: 640, y: 150 },
  terminal: { id: "terminal", label: "Certification Terminal", short: "Terminal", verb: "Use terminal", x: 1150, y: 440 },
  ares: { id: "ares", label: "ARES", short: "ARES", verb: "Talk to ARES", x: 640, y: 300 },
};

export const STATION_TITLES: Record<StationId, string> = {
  suit: "Suit Integrity & Pressure Check",
  oxygen: "Oxygen System Check",
  comms: "Communications Check",
  emergency: "Emergency Kit Check",
};

export interface ScienceNote {
  title: string;
  body: string;
  simplified?: string;
}

export const SCIENCE_NOTES: Record<StationId, ScienceNote> = {
  suit: {
    title: "A suit is a personal spacecraft",
    body: "A spacesuit is not just clothing. It keeps your body under pressure, supplies oxygen, removes carbon dioxide, controls temperature in extreme heat and cold, and shields you from dust, sunlight and tiny micrometeoroids. Without pressure, the fluids in your body would start to boil at body temperature.",
    simplified:
      "Many spacewalk suits run at about 29.6 kPa (4.3 psi) of nearly pure oxygen — about 30% of sea-level air pressure — which keeps the suit flexible enough to move in.",
  },
  oxygen: {
    title: "Oxygen in, carbon dioxide out",
    body: "Breathing has two jobs. You need oxygen supplied, and you need the carbon dioxide you breathe out removed. These are separate systems: plenty of oxygen will not save you if CO₂ builds up inside a sealed suit. Suits use chemical or regenerable filters (\"scrubbers\") to remove CO₂, and carry a backup oxygen supply for emergencies.",
  },
  comms: {
    title: "Radio waves take time to travel",
    body: "Radio signals travel at the speed of light — about 300,000 km per second. The Moon is on average about 384,400 km away, so a message takes roughly 1.3 seconds each way, or about 2.6 seconds for a question and answer. The farther away a spacecraft is, the longer the delay; for distant planets it grows to minutes, so crews must be able to act without waiting for Earth.",
  },
  emergency: {
    title: "Checklists reduce risk",
    body: "Under stress, people forget steps. Space crews train with written procedures and checklists so that the right actions happen in the right order, even in an emergency. Preparing supplies in advance and practising procedures turns a frightening moment into a familiar routine.",
  },
};

/** Mission-checklist board copy (optional objective). */
export const BOARD_LINES = [
  "Verify suit pressure integrity before every excursion.",
  "Confirm primary AND backup oxygen, plus CO₂ removal.",
  "Establish a radio link — expect signal delay.",
  "Know your emergency kit and procedure card by heart.",
  "If in doubt: stop, communicate, check, return.",
];
