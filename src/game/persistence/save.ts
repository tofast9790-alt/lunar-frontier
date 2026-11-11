import { createStore, useStore } from "@/game/core/store";

/** Local save (localStorage). Versioned so future missions/resources can migrate cleanly. */
export const SAVE_KEY = "lunar-frontier-save-v1";

export interface MissionRecord {
  completed: boolean;
  bestScore: number;
  timesCompleted: number;
  lastCompletedAt: string | null;
}

export interface Settings {
  reducedMotion: boolean;
  textSpeed: "normal" | "instant";
  showTouchPad: boolean;
}

export interface SaveData {
  version: 1;
  missions: Record<string, MissionRecord>;
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  reducedMotion: false,
  textSpeed: "normal",
  showTouchPad: true,
};

export function defaultSave(): SaveData {
  return { version: 1, missions: {}, settings: { ...DEFAULT_SETTINGS } };
}

export const saveStore = createStore<SaveData>(defaultSave());
let loaded = false;

function sanitize(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SaveData>;
  const missions: Record<string, MissionRecord> = {};
  if (r.missions && typeof r.missions === "object") {
    for (const [id, m] of Object.entries(r.missions)) {
      if (!m || typeof m !== "object") continue;
      missions[id] = {
        completed: Boolean(m.completed),
        bestScore: Number.isFinite(m.bestScore) ? Math.max(0, Math.round(m.bestScore)) : 0,
        timesCompleted: Number.isFinite(m.timesCompleted) ? m.timesCompleted : 0,
        lastCompletedAt: typeof m.lastCompletedAt === "string" ? m.lastCompletedAt : null,
      };
    }
  }
  return { version: 1, missions, settings: { ...base.settings, ...(r.settings ?? {}) } };
}

function write(data: SaveData) {
  saveStore.replace(data);
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be unavailable (private mode); the game keeps working in memory.
  }
}

/** Call once on the client (root effect). */
export function loadSave() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    saveStore.replace(raw ? sanitize(JSON.parse(raw)) : defaultSave());
  } catch {
    saveStore.replace(defaultSave());
  }
}

/** Records a completed run. Best score only ever goes up. */
export function recordMissionResult(missionId: string, score: number): { isNewBest: boolean; previousBest: number } {
  const current = saveStore.get();
  const prev = current.missions[missionId];
  const previousBest = prev?.bestScore ?? 0;
  const isNewBest = !prev?.completed || score > previousBest;
  write({
    ...current,
    missions: {
      ...current.missions,
      [missionId]: {
        completed: true,
        bestScore: Math.max(previousBest, score),
        timesCompleted: (prev?.timesCompleted ?? 0) + 1,
        lastCompletedAt: new Date().toISOString(),
      },
    },
  });
  return { isNewBest, previousBest };
}

export function updateSettings(patch: Partial<Settings>) {
  const current = saveStore.get();
  write({ ...current, settings: { ...current.settings, ...patch } });
}

/** Clears mission progress and settings. */
export function resetSave() {
  write(defaultSave());
}

export function useSave() {
  return useStore(saveStore);
}
