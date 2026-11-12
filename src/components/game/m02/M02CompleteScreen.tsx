import { Link } from "@tanstack/react-router";
import surfaceImg from "@/assets/m02-surface.jpg";
import { Button } from "@/components/ui/button";
import { MISSION_02, MISSION_ID } from "@/game/missions/mission02/data";
import { MAX_SCORE, rankFor } from "@/game/missions/mission02/scoring";
import { startMission02, useM02 } from "@/game/missions/mission02/state";
import { useSave } from "@/game/persistence/save";

export function M02CompleteScreen() {
  const { result } = useM02();
  const save = useSave();
  const best = save.missions[MISSION_ID]?.bestScore ?? 0;
  const total = result?.score.total ?? 0;

  return (
    <div className="starfield h-full w-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-5 p-4 sm:p-8">
        <section className="panel glow-cyan p-6 text-center sm:p-8">
          <div className="hud-label text-primary">{MISSION_02.chapter}</div>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Mission 02 Complete</h1>
          <p className="mt-2 text-muted-foreground">{MISSION_02.title} — landed, beacon online, first footprints at the outpost site.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            <div>
              <div className="hud-label">Score</div>
              <div className="font-display text-4xl text-amber">{total}</div>
              <div className="text-xs text-muted-foreground">
                of {MAX_SCORE} · {rankFor(total)}
              </div>
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
          <img
            src={surfaceImg}
            alt="Astronaut beside the landed lander with the upright beacon panel and Earth on the horizon"
            loading="lazy"
            width={1600}
            height={912}
            className="h-48 w-full object-cover sm:h-full"
          />
          <div className="space-y-2 p-5">
            <div className="hud-label text-amber">Next · in development</div>
            <h2 className="text-2xl font-semibold">The campaign continues</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your beacon is now guiding the next landers in. Further missions of the Lunar Frontier campaign are still in development and
              will arrive in a future update.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="mission" size="xl" onClick={() => startMission02("briefing")}>
            Replay Mission 02
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
