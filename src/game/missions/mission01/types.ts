export type StationId = "suit" | "oxygen" | "comms" | "emergency";
export type InteractableId = StationId | "board" | "terminal" | "ares";
export type { Speaker, DialogueLine } from "@/game/core/dialogue";

export const STATION_IDS: StationId[] = ["suit", "oxygen", "comms", "emergency"];
