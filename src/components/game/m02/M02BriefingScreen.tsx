import { Button } from "@/components/ui/button";
import { DESCENT } from "@/game/missions/mission02/descent";
import { MISSION_02 } from "@/game/missions/mission02/data";
import { openOverlay, setPhase, useM02 } from "@/game/missions/mission02/state";
import { ControlsLegend } from "../ControlsLegend";
import { M02ObjectiveList } from "./M02ObjectiveList";

export const M02_KEYS: [string, string][] = [
  ["Space (hold)", "Main engine — slows your fall"],
  ["W A S D / Arrows", "Side thrusters (landing) · walk (surface)"],
  ["E", "Interact on the surface"],
  ["H", "ARES hints"],
  ["Esc", "Pause / close panel"],
];

export function M02BriefingScreen() {
  const s = useM02();
  return (
    <div className="starfield h-full w-full overflow-y-auto">
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <header className="flex flex-wrap items-end justify-between gap-3 lg:col-span-2">
          <div>
            <div className="hud-label text-primary">
              {MISSION_02.chapter} · {MISSION_02.code}
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">Mission Briefing — {MISSION_02.title}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => openOverlay({ kind: "pause" })}>
            Menu (Esc)
          </Button>
        </header>

        <section className="panel space-y-4 p-5">
          <div>
            <h2 className="hud-label mb-1">Situation</h2>
            <p className="leading-relaxed">{MISSION_02.story}</p>
          </div>
          <div className="rounded-md border border-amber/50 bg-amber/5 p-3">
            <h2 className="hud-label mb-1 text-amber">Primary objective</h2>
            <p className="text-sm">{MISSION_02.primaryObjective}</p>
          </div>
          <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
            <h2 className="hud-label mb-1 text-primary">Optional objective</h2>
            <p className="text-sm">{MISSION_02.optionalObjective}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <h2 className="hud-label mb-1">Touchdown limits</h2>
            <ul className="grid gap-1 font-mono text-sm sm:grid-cols-3">
              <li>Down ≤ {DESCENT.maxVs.toFixed(1)} m/s</li>
              <li>Sideways ≤ {DESCENT.maxHs.toFixed(1)} m/s</li>
              <li>Inside the {DESCENT.lzRadius} m zone</li>
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              Fuel is tight. If a landing goes wrong the flight computer aborts to orbit and you can try again (each abort costs points).
            </p>
          </div>
          <div>
            <h2 className="hud-label mb-2">Controls</h2>
            <ControlsLegend keys={M02_KEYS} />
          </div>
          <p className="text-xs text-muted-foreground">
            {MISSION_02.targetDuration} Values marked <span className="sim-tag">sim</span> are simplified for gameplay.
          </p>
        </section>

        <aside className="panel flex flex-col gap-4 p-5">
          <div>
            <h2 className="hud-label mb-3">Mission checklist</h2>
            <M02ObjectiveList state={s} />
          </div>
          <div className="mt-auto space-y-2">
            <Button variant="mission" size="xl" className="w-full" autoFocus onClick={() => setPhase("cockpit")}>
              Take your seat in the lander
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
