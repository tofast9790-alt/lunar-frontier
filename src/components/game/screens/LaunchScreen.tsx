import { useEffect, useState } from "react";
import { SkipForward } from "lucide-react";
import launchImg from "@/assets/launch-pad.jpg";
import liftoffImg from "@/assets/launch-liftoff.jpg";
import { Button } from "@/components/ui/button";
import { setPhase, useMission } from "@/game/missions/mission01/state";
import { useSave } from "@/game/persistence/save";
import { cn } from "@/lib/utils";

const CALLOUTS: Record<number, string> = {
  10: "Final launch poll — all stations report GO.",
  8: "Crew access arm retracted.",
  6: "Commander suit pressure nominal. Comms link nominal.",
  4: "Vehicle on internal power.",
  3: "Ignition sequence start.",
  1: "Engines building to full thrust.",
  0: "Liftoff! Lunar Frontier is on its way to the Moon.",
};
const LIFTOFF_MS = 5000;

export function LaunchScreen() {
  const paused = useMission().overlay?.kind === "pause";
  const reduced = useSave().settings.reducedMotion;
  const [t, setT] = useState(10);
  const [callout, setCallout] = useState(CALLOUTS[10]);
  const liftoff = t <= 0;

  useEffect(() => {
    if (paused) return;
    if (!liftoff) {
      const id = window.setTimeout(() => {
        const next = t - 1;
        setT(next);
        if (CALLOUTS[next]) setCallout(CALLOUTS[next]);
      }, 1000);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setPhase("complete"), LIFTOFF_MS);
    return () => window.clearTimeout(id);
  }, [t, liftoff, paused]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-background", liftoff && !reduced && "animate-shake")}>
      <img src={launchImg} alt="Crewed rocket on the launch pad at night" className="absolute inset-0 h-full w-full object-cover" width={1600} height={912} />
      <img
        src={liftoffImg}
        alt="Rocket lifting off with a bright exhaust plume"
        width={1600}
        height={912}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          liftoff ? "animate-kenburns opacity-100" : "opacity-0",
        )}
      />
      <div className="image-fade-bottom absolute inset-0" />

      <div className="absolute top-4 right-4">
        <Button variant="hud" size="sm" onClick={() => setPhase("complete")}>
          <SkipForward aria-hidden /> Skip launch
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-6 text-center">
        <div className="hud-label text-primary">{liftoff ? "Ascent" : "Terminal countdown"} · simplified sequence</div>
        <div className={cn("font-display text-7xl font-bold tabular-nums sm:text-8xl", liftoff ? "text-amber" : "text-foreground")} aria-live="off">
          {liftoff ? "LIFTOFF" : `T−${String(t).padStart(2, "0")}`}
        </div>
        <p className="panel max-w-xl px-4 py-2 text-base" aria-live="polite">
          {callout}
        </p>
        {paused && <p className="hud-label text-amber">Countdown holding (paused)</p>}
      </div>
    </div>
  );
}
