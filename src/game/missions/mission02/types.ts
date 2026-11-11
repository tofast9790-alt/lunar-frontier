export type { Speaker, DialogueLine } from "@/game/core/dialogue";

export type CockpitCheckId = "engine" | "radar" | "guidance";
export const COCKPIT_CHECK_IDS: CockpitCheckId[] = ["engine", "radar", "guidance"];

export type SiteId = "ridge" | "basin" | "plateau" | "slope";
export const SITE_IDS: SiteId[] = ["ridge", "basin", "plateau", "slope"];

/** Science notes the player can read (optional objective). */
export type NoteId = CockpitCheckId | "site" | "beacon" | "ice";
export const NOTE_IDS: NoteId[] = ["engine", "radar", "guidance", "site", "beacon", "ice"];

export type SurfaceId = "beacon" | "sample" | "lander";

export type PanelTilt = "flat" | "angled" | "vertical";
export type Heading = "north" | "east" | "south" | "west";
