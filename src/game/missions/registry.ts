/** Campaign registry. Add future missions here; only "playable" entries can be launched. */
export type MissionAvailability = "playable" | "in-development";

export interface MissionMeta {
  id: string;
  number: number;
  chapter: string;
  title: string;
  summary: string;
  availability: MissionAvailability;
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
  },
  {
    id: "m02",
    number: 2,
    chapter: "Chapter 1 — The Arrival",
    title: "Touchdown",
    summary: "Descend toward the lunar south polar region and land safely. Coming in a future update.",
    availability: "in-development",
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
