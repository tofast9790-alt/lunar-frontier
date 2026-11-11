import { useEffect, useState } from "react";
import { Bot, ChevronDown, Hand, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INTERACTABLES, MISSION_01, STATION_TITLES } from "@/game/missions/mission01/data";
import { checksDone } from "@/game/missions/mission01/scoring";
import { advanceComms, openOverlay, useMission, type MissionState } from "@/game/missions/mission01/state";
import { STATION_IDS, type InteractableId } from "@/game/missions/mission01/types";
import { PhaserGame } from "@/game/phaser/PhaserGame";
import { useSave } from "@/game/persistence/save";
import { CommsPanel } from "../CommsPanel";
import { ObjectiveList } from "../ObjectiveList";
import { TouchPad } from "../TouchPad";
import { cn } from "@/lib/utils";

export function interactWith(id: InteractableId) {
  if (id === "ares") openOverlay({ kind: "ares" });
  else openOverlay({ kind: "station", id });
}

function nextObjective(s: MissionState): string {
  const next = STATION_IDS.find((id) => !s.checks[id]);
  if (next) return `Next: ${STATION_TITLES[next]}`;
  if (!s.quiz.passed) return "Next: Certification Terminal (east wall)";
  return "Ready: proceed via the terminal";
}

export function TrainingScreen() {
  const s = useMission();
  const { settings } = useSave();
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  useEffect(() => {
    // Wide screens have room for the full tracker without covering stations.
    setObjectivesOpen(window.innerWidth >= 1500);
  }, []);
  const near = s.nearby ? INTERACTABLES[s.nearby] : null;
  const done = s.nearby && s.nearby !== "ares" && s.nearby !== "board" && s.nearby !== "terminal" ? s.checks[s.nearby] : false;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <PhaserGame key={s.runId} />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="panel pointer-events-auto px-3 py-2">
          <div className="hud-label text-primary">{MISSION_01.code} · Prep Bay</div>
          <div className="font-display text-sm font-semibold sm:text-base">{MISSION_01.title}</div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <Button variant="hud" size="sm" onClick={(e) => { e.currentTarget.blur(); openOverlay({ kind: "ares" }); }}>
            <Bot aria-hidden /> ARES <span className="hidden opacity-70 sm:inline">(H)</span>
          </Button>
          <Button variant="hud" size="sm" onClick={(e) => { e.currentTarget.blur(); openOverlay({ kind: "pause" }); }} aria-label="Pause (Esc)">
            <Pause aria-hidden /> <span className="hidden sm:inline">Pause</span>
          </Button>
        </div>
      </div>

      {/* Objective tracker */}
      <aside className="panel pointer-events-auto absolute top-20 right-3 w-64 max-w-[calc(100%-1.5rem)] p-3" aria-label="Objectives">
        <button
          type="button"
          className="flex w-full items-center justify-between"
          aria-expanded={objectivesOpen}
          onClick={(e) => {
            setObjectivesOpen((o) => !o);
            e.currentTarget.blur();
          }}
        >
          <span className="hud-label text-foreground">Objectives · {checksDone(s.checks)}/4</span>
          <ChevronDown className={cn("size-4 transition-transform", objectivesOpen && "rotate-180")} aria-hidden />
        </button>
        {objectivesOpen ? (
          <div className="mt-3">
            <ObjectiveList state={s} compact />
          </div>
        ) : (
          <p className="mt-1 text-xs text-amber">{nextObjective(s)}</p>
        )}
      </aside>

      {/* Interaction prompt */}
      {near && s.overlay === null && (
        <div className="absolute top-16 left-1/2 z-10 -translate-x-1/2 md:top-3">
          <Button
            variant="mission"
            size="xl"
            className="animate-fade-up"
            onClick={(e) => {
              e.currentTarget.blur();
              interactWith(near.id);
            }}
          >
            <kbd className="rounded bg-amber-foreground/15 px-1.5 font-mono text-sm">E</kbd>
            {done ? `Review — ${near.label}` : `${near.verb} — ${near.label}`}
            <Hand aria-hidden className="sm:hidden" />
          </Button>
        </div>
      )}

      {/* Comms + controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
        <div className="pointer-events-auto w-full max-w-md">
          <CommsPanel queue={s.commsQueue} log={s.commsLog} onAdvance={advanceComms} />
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {settings.showTouchPad && <TouchPad />}
          <p className="panel hidden px-2 py-1 font-mono text-[11px] text-muted-foreground xl:block">
            WASD/Arrows move · E interact · H ARES · Esc pause
          </p>
        </div>
      </div>
    </div>
  );
}
