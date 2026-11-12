import { useEffect, useState } from "react";
import { ChevronDown, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SURFACE_POINTS } from "@/game/missions/mission02/data";
import { openOverlay, useM02, type M02State } from "@/game/missions/mission02/state";
import type { SurfaceId } from "@/game/missions/mission02/types";
import { PhaserGame } from "@/game/phaser/PhaserGame";
import { useSave } from "@/game/persistence/save";
import { cn } from "@/lib/utils";
import { TouchPad } from "../TouchPad";
import { M02Comms, M02TopBar } from "./M02Hud";
import { M02ObjectiveList } from "./M02ObjectiveList";

export function interactSurface(id: SurfaceId) {
  openOverlay({ kind: "surface", id });
}

function isDone(s: M02State, id: SurfaceId) {
  if (id === "beacon") return s.beacon.deployed;
  if (id === "sample") return s.sampleCollected;
  return s.reported;
}

function nextObjective(s: M02State) {
  if (!s.beacon.deployed) return "Next: deploy the beacon (marker east of the lander)";
  if (!s.sampleCollected) return "Next: report at the ladder · optional rim sample to the south-east";
  return "Next: report to Mission Control at the lander ladder";
}

export function SurfaceScreen() {
  const s = useM02();
  const { settings } = useSave();
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  useEffect(() => setObjectivesOpen(window.innerWidth >= 1500), []);
  const near = s.nearby ? SURFACE_POINTS[s.nearby] : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <PhaserGame key={s.runId} scene="surface" />
      <M02TopBar place="South polar surface" />

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
          <span className="hud-label text-foreground">Objectives</span>
          <ChevronDown className={cn("size-4 transition-transform", objectivesOpen && "rotate-180")} aria-hidden />
        </button>
        {objectivesOpen ? (
          <div className="mt-3">
            <M02ObjectiveList state={s} />
          </div>
        ) : (
          <p className="mt-1 text-xs text-amber">{nextObjective(s)}</p>
        )}
      </aside>

      {near && s.overlay === null && (
        <div className="absolute top-16 left-1/2 z-10 -translate-x-1/2 md:top-3">
          <Button
            variant="mission"
            size="xl"
            className="animate-fade-up"
            onClick={(e) => {
              e.currentTarget.blur();
              interactSurface(near.id);
            }}
          >
            <kbd className="rounded bg-amber-foreground/15 px-1.5 font-mono text-sm">E</kbd>
            {isDone(s, near.id) ? `Review — ${near.label}` : `${near.verb} — ${near.label}`}
            <Hand aria-hidden className="sm:hidden" />
          </Button>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
        <div className="pointer-events-auto w-full max-w-md">
          <M02Comms />
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {settings.showTouchPad && <TouchPad />}
          <p className="panel hidden px-2 py-1 font-mono text-[11px] text-muted-foreground xl:block">
            WASD/Arrows walk · E interact · H ARES · Esc pause
          </p>
        </div>
      </div>
    </div>
  );
}
