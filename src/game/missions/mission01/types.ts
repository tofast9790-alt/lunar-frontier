export type StationId = "suit" | "oxygen" | "comms" | "emergency";
export type InteractableId = StationId | "board" | "terminal" | "ares";
export type Speaker = "elena" | "ares" | "system";

export interface DialogueLine {
  id: string;
  speaker: Speaker;
  text: string;
}

export const STATION_IDS: StationId[] = ["suit", "oxygen", "comms", "emergency"];
