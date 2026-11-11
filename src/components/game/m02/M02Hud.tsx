import { Bot, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPEAKER_NAMES } from "@/game/missions/mission02/dialogue";
import { MISSION_02 } from "@/game/missions/mission02/data";
import { advanceComms, openOverlay, useM02 } from "@/game/missions/mission02/state";
import { CommsPanel } from "../CommsPanel";

/** Mission name + ARES / Pause buttons shared by every Mission 02 play screen. */
export function M02TopBar({ place }: { place: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
      <div className="panel pointer-events-auto px-3 py-2">
        <div className="hud-label text-primary">
          {MISSION_02.code} · {place}
        </div>
        <div className="font-display text-sm font-semibold sm:text-base">{MISSION_02.title}</div>
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
  );
}

export function M02Comms() {
  const s = useM02();
  return <CommsPanel queue={s.commsQueue} log={s.commsLog} onAdvance={advanceComms} names={SPEAKER_NAMES} />;
}
