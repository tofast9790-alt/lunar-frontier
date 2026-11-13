import { Link } from "@tanstack/react-router";
import outpostImg from "@/assets/intro-outpost.jpg";
import { Button } from "@/components/ui/button";
import { MISSION_ID } from "@/game/missions/mission01/data";
import { MAX_SCORE, rankFor } from "@/game/missions/mission01/scoring";
import { startMission, useMission } from "@/game/missions/mission01/state";
import { useSave } from "@/game/persistence/save";

export function CompleteScreen() {
  const { result } = useMission();
  const save = useSave();
  const best = save.missions[MISSION_ID]?.bestScore ?? 0;
  const total = result?.score.total ?? 0;

  return (
    <div className="starfield h-full w-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 sm:p-8">
        <section className="panel glow-cyan p-6 text-center sm:p-8">
          <div className="hud-label text-primary">Chapter 1 — The Arrival</div>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Mission 01 Complete</h1>
          <p className="mt-2 text-muted-foreground">The Selection — launch authorized, crew on its way.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            <div>
              <div className="hud-label">Score</div>
              <div className="font-display text-4xl text-amber">{total}</div>
              <div className="text-xs text-muted-foreground">of {MAX_SCORE} · {rankFor(total)}</div>
            </div>
            <div>
              <div className="hud-label">Best score</div>
              <div className="font-display text-4xl">{best}</div>
              {result?.isNewBest && <div className="text-xs text-success">New personal best — saved</div>}
              {result && !result.isNewBest && <div className="text-xs text-muted-foreground">Saved to Mission Records</div>}
            </div>
          </div>
        </section>

        <section className="panel grid overflow-hidden sm:grid-cols-[1fr_1.2fr]">
          <img src={outpostImg} alt="Lunar south polar outpost at low sun angle" loading="lazy" width={1600} height={912} className="h-48 w-full object-cover sm:h-full" />
          <div className="space-y-2 p-5">
            <div className="hud-label text-amber">Next mission · unlocked</div>
            <h2 className="text-2xl font-semibold">Mission 02 — Touchdown</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your lander approaches the lunar south polar region, where the Sun barely rises above the horizon and shadows stretch for kilometres. Pick a safe site and land it yourself.
            </p>
            <Button variant="mission" size="lg" className="mt-2" asChild>
              <Link to="/mission-02">Start Mission 02</Link>
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="mission" size="xl" onClick={() => startMission("briefing")}>
            Replay Mission 01
          </Button>
          <Button variant="hud" size="xl" asChild>
            <Link to="/records">Mission Records</Link>
          </Button>
          <Button variant="hud" size="xl" asChild>
            <Link to="/">Main menu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
