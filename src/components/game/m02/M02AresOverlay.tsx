import { Button } from "@/components/ui/button";
import { COCKPIT_TITLES, SITES } from "@/game/missions/mission02/data";
import { DESCENT } from "@/game/missions/mission02/descent";
import { allCockpitDone, isOptionalComplete } from "@/game/missions/mission02/scoring";
import { useM02, type M02State } from "@/game/missions/mission02/state";
import { COCKPIT_CHECK_IDS } from "@/game/missions/mission02/types";
import { cn } from "@/lib/utils";
import { OverlayFrame } from "../OverlayFrame";
import { Portrait } from "../Portrait";

/** Context-aware hint for whatever the player is doing right now. */
export function aresHint(s: M02State): string {
  switch (s.phase) {
    case "intro":
    case "briefing":
      return "Read the touchdown limits in the briefing, then take your seat in the lander. I'll be riding along.";
    case "cockpit": {
      const next = COCKPIT_CHECK_IDS.find((id) => !s.cockpit[id]);
      if (next === "engine") return "Engine check: pressurise the tanks before arming. Think about what the engine is fighting the whole time you hover.";
      if (next === "radar") return "Radar check: the echo goes down AND back up, so halve the round trip. Radio covers 300 m in one microsecond.";
      if (next === "guidance") return "Guidance: drag the slider until the star sits inside the guide circle (within ±3°), then press Mark.";
      return "All systems GO. Choose the landing site next.";
    }
    case "site":
      if (s.site.chosen) return `Site ${SITES[s.site.chosen].letter} confirmed. Proceed to powered descent.`;
      return "A good site needs four things: a gentle slope, few boulders, sunlight for solar power and Earth in view for radio. Being right on top of the ice isn't worth losing all four.";
    case "descent": {
      const t = s.descent.telemetry;
      if (s.descent.status === "failed") return "Abort logged, no harm done. Tip: let yourself fall early, then brake hard from about 80 m so you arrive slow at the bottom.";
      if (s.descent.status === "landed") return "Touchdown confirmed. Step outside when you're ready.";
      if (!t) return `Burn early only to stop the fall getting out of hand. You need to be under ${DESCENT.maxVs} m/s down and ${DESCENT.maxHs} m/s sideways at contact.`;
      if (t.distance > DESCENT.lzRadius * 2) return "You're off target. The arrow next to 'To LZ' points at the ring — tap the side thrusters that way, then tap the opposite way to stop.";
      if (t.hs > DESCENT.maxHs) return "Sideways drift too high. Fire the thruster opposite to your drift until 'Sideways' turns green.";
      if (-t.vs > DESCENT.maxVs && t.alt < 100) return "Falling too fast for this height. Hold Space until 'Down speed' turns green, then pulse it.";
      if (t.fuel < 25) return "Fuel is low — commit to the landing now and avoid hovering.";
      return "Looking good. Keep the ring under you and pulse the engine to stay just under the speed limit.";
    }
    case "surface":
      if (!s.beacon.deployed)
        return "Beacon site: north-east of the lander (amber marker). Hint: polar panels stand upright — and long shadows point away from the Sun.";
      if (!isOptionalComplete(s.notesRead, s.sampleCollected))
        return "Beacon is transmitting. Report at the ladder south of the lander. For the bonus: collect a rim sample to the south-east and read every science note.";
      return "Everything done, Commander. Report to Mission Control at the lander ladder.";
    default:
      return "Mission objectives complete. Nice flying, Commander.";
  }
}

export function M02AresOverlay({ onClose }: { onClose: () => void }) {
  const s = useM02();
  const systems: [string, boolean][] = [
    ...COCKPIT_CHECK_IDS.map((id) => [COCKPIT_TITLES[id], s.cockpit[id]] as [string, boolean]),
    ["Landing site confirmed", s.site.chosen !== null],
    ["Safe touchdown", s.descent.landing !== null],
    ["Navigation beacon", s.beacon.deployed],
    ["Report sent", s.reported],
  ];
  return (
    <OverlayFrame kicker="Robotic assistant" title="ARES — hints & diagnostics" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Portrait speaker="ares" className="h-16 w-16" />
          <p className="text-sm leading-relaxed">{aresHint(s)}</p>
        </div>
        <div>
          <div className="hud-label mb-2">Mission status</div>
          <ul className="grid gap-1.5 font-mono text-xs sm:grid-cols-2">
            {systems.map(([label, ok]) => (
              <li key={label} className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1.5">
                <span>{label}</span>
                <span className={cn(ok ? "text-success" : "text-amber")}>{ok ? "GO" : "PENDING"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Powered descent: {allCockpitDone(s.cockpit) && s.site.chosen ? "AUTHORIZED" : "requires all checks + a safe site"}
            {s.descent.failures > 0 && ` · aborts so far: ${s.descent.failures}`}
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="hud" onClick={onClose} data-autofocus>
            Thanks, ARES
          </Button>
        </div>
      </div>
    </OverlayFrame>
  );
}
