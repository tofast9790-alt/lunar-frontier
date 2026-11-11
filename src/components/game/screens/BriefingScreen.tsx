import { Button } from "@/components/ui/button";
import { MISSION_01 } from "@/game/missions/mission01/data";
import { openOverlay, setPhase, useMission } from "@/game/missions/mission01/state";
import { ControlsLegend } from "../ControlsLegend";
import { ObjectiveList } from "../ObjectiveList";

export function BriefingScreen() {
  const s = useMission();
  return (
    <div className="starfield h-full w-full overflow-y-auto">
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <header className="lg:col-span-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="hud-label text-primary">
              {MISSION_01.chapter} · {MISSION_01.code}
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Mission Briefing — {MISSION_01.title}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => openOverlay({ kind: "pause" })}>
            Menu (Esc)
          </Button>
        </header>

        <section className="panel space-y-4 p-5">
          <div>
            <h2 className="hud-label mb-1">Situation</h2>
            <p className="leading-relaxed">{MISSION_01.story}</p>
          </div>
          <div className="rounded-md border border-amber/50 bg-amber/5 p-3">
            <h2 className="hud-label mb-1 text-amber">Primary objective</h2>
            <p className="text-sm">{MISSION_01.primaryObjective}</p>
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
            <h2 className="hud-label mb-1 text-primary">Optional objective</h2>
            <p className="text-sm">{MISSION_01.optionalObjective}</p>
          </div>
          <div>
            <h2 className="hud-label mb-2">Controls</h2>
            <ControlsLegend />
          </div>
          <p className="text-xs text-muted-foreground">
            {MISSION_01.targetDuration} Values marked <span className="sim-tag">sim</span> are simplified for gameplay.
          </p>
        </section>

        <aside className="panel flex flex-col gap-4 p-5">
          <div>
            <h2 className="hud-label mb-3">Mission checklist</h2>
            <ObjectiveList state={s} />
          </div>
          <div className="mt-auto space-y-2">
            <Button variant="mission" size="xl" className="w-full" autoFocus onClick={() => setPhase("training")}>
              Enter the Prep Bay
            </Button>
            <p className="text-center text-xs text-muted-foreground">Launch authorization requires all four checks and a quiz pass.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
