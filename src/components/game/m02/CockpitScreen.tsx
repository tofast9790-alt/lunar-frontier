import { useState } from "react";
import { ChevronRight, CircleDot, CheckCircle2 } from "lucide-react";
import cockpitImg from "@/assets/m02-cockpit.jpg";
import { Button } from "@/components/ui/button";
import { COCKPIT_TITLES } from "@/game/missions/mission02/data";
import { allCockpitDone, cockpitDone } from "@/game/missions/mission02/scoring";
import { setPhase, useM02 } from "@/game/missions/mission02/state";
import { COCKPIT_CHECK_IDS, type CockpitCheckId } from "@/game/missions/mission02/types";
import { cn } from "@/lib/utils";
import { EngineCheck, GuidanceCheck, RadarCheck } from "./CockpitChecks";
import { M02Comms, M02TopBar } from "./M02Hud";

const CHECKS: Record<CockpitCheckId, React.ComponentType<{ onClose: () => void }>> = {
  engine: EngineCheck,
  radar: RadarCheck,
  guidance: GuidanceCheck,
};

const BLURB: Record<CockpitCheckId, string> = {
  engine: "Tanks, engine arm, fuel budget",
  radar: "Altitude by radio echo",
  guidance: "Star-tracker alignment",
};

export function CockpitScreen() {
  const s = useM02();
  const [active, setActive] = useState<CockpitCheckId | null>(null);
  const ready = allCockpitDone(s.cockpit);
  const Check = active ? CHECKS[active] : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <img src={cockpitImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" width={1600} height={912} />
      <div className="scrim absolute inset-0" />
      <M02TopBar place="Lander cockpit" />

      <div className="relative h-full overflow-y-auto px-3 pt-20 pb-44 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[18rem_1fr]">
          <aside className="panel h-fit space-y-3 p-4">
            <div className="hud-label">Pre-descent systems · {cockpitDone(s.cockpit)}/3 GO</div>
            <ul className="space-y-2">
              {COCKPIT_CHECK_IDS.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setActive(id)}
                    aria-pressed={active === id}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
                      active === id ? "border-primary bg-primary/10" : "border-border hover:border-primary/60",
                    )}
                  >
                    {s.cockpit[id] ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="GO" />
                    ) : (
                      <CircleDot className="mt-0.5 size-4 shrink-0 text-amber" aria-label="Pending" />
                    )}
                    <span>
                      <span className="block font-display font-semibold">{COCKPIT_TITLES[id]}</span>
                      <span className="block text-xs text-muted-foreground">{BLURB[id]}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Button variant="mission" size="xl" className="w-full" disabled={!ready} onClick={() => setPhase("site")}>
              Choose landing site <ChevronRight aria-hidden />
            </Button>
            {!ready && <p className="text-center text-xs text-muted-foreground">All three systems must report GO.</p>}
          </aside>

          <section className="panel p-5" aria-live="polite">
            {Check && active ? (
              <>
                <div className="hud-label text-primary">Procedure</div>
                <h2 className="mb-3 text-xl font-semibold">{COCKPIT_TITLES[active]}</h2>
                <Check key={active} onClose={() => setActive(null)} />
              </>
            ) : (
              <div className="space-y-2">
                <div className="hud-label text-primary">Lander computer</div>
                <h2 className="text-xl font-semibold">{ready ? "All systems GO" : "Select a system to check"}</h2>
                <p className="text-sm text-muted-foreground">
                  {ready
                    ? "Every pre-descent check is complete. Choose the landing site next."
                    : "Work through each system on the left. You can do them in any order."}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <div className="pointer-events-auto w-full max-w-md">
          <M02Comms />
        </div>
      </div>
    </div>
  );
}
