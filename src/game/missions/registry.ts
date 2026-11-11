/** Campaign registry. Add future missions here; only "playable" entries can be launched. */
export type MissionAvailability = "playable" | "in-development";

export interface MissionMeta {
  id: string;
  number: number;
  chapter: string;
  title: string;
  summary: string;
  availability: MissionAvailability;
  /** Page that plays this mission. */
  path: "/play" | "/mission-02";
  /** Mission that must be completed before this one unlocks. */
  requires?: string;
}

export const PLANNED_MISSION_COUNT = 15;

export const MISSIONS: MissionMeta[] = [
  {
    id: "m01",
    number: 1,
    chapter: "Chapter 1 — The Arrival",
    title: "The Selection",
    summary: "Prepare in the training bay, verify life-support equipment and earn launch authorization.",
    availability: "playable",
    path: "/play",
  },
  {
    id: "m02",
    number: 2,
    chapter: "Chapter 1 — The Arrival",
    title: "Touchdown",
    summary: "Run pre-descent checks, pick a safe site, fly a top-down landing and plant the first navigation beacon.",
    availability: "playable",
    path: "/mission-02",
    requires: "m01",
  },
];

export type MissionRecordState = "locked" | "unlocked" | "completed";

export function missionRecordState(
  mission: MissionMeta,
  completed: Record<string, boolean>,
): MissionRecordState {
  if (completed[mission.id]) return "completed";
  if (mission.availability !== "playable") return "locked";
  if (mission.requires && !completed[mission.requires]) return "locked";
  return "unlocked";
}
