import { CheckCircle2, Circle, Lock, Star } from "lucide-react";
import { COCKPIT_TITLES } from "@/game/missions/mission02/data";
import { allCockpitDone, cockpitDone, isOptionalComplete } from "@/game/missions/mission02/scoring";
import type { M02State } from "@/game/missions/mission02/state";
import { COCKPIT_CHECK_IDS, NOTE_IDS } from "@/game/missions/mission02/types";
import { cn } from "@/lib/utils";

function Row({ done, locked, children }: { done: boolean; locked?: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-start gap-2 text-sm", done ? "text-success" : locked ? "text-muted-foreground" : "text-foreground")}>
      {done ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-label="Complete" />
      ) : locked ? (
        <Lock className="mt-0.5 size-4 shrink-0" aria-label="Locked" />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-amber" aria-label="Incomplete" />
      )}
      <span>{children}</span>
    </li>
  );
}

export function M02ObjectiveList({ state: s }: { state: M02State }) {
  const checks = allCockpitDone(s.cockpit);
  const sited = s.site.chosen !== null;
  const landed = s.descent.landing !== null;
  const notes = NOTE_IDS.filter((id) => s.notesRead[id]).length;
  return (
    <div className="space-y-3">
      <div>
        <div className="hud-label mb-1.5">Primary</div>
        <ul className="space-y-1.5">
          <Row done={checks}>Pre-descent checks ({cockpitDone(s.cockpit)}/{COCKPIT_CHECK_IDS.length})</Row>
          {!checks &&
            COCKPIT_CHECK_IDS.map((id) => (
              <li key={id} className={cn("pl-6 text-xs", s.cockpit[id] ? "text-success" : "text-muted-foreground")}>
                {s.cockpit[id] ? "✓" : "·"} {COCKPIT_TITLES[id]}
              </li>
            ))}
          <Row done={sited} locked={!checks}>Choose a safe landing site</Row>
          <Row done={landed} locked={!sited}>
            Land inside the surveyed zone{s.descent.failures > 0 && ` (${s.descent.failures} abort${s.descent.failures === 1 ? "" : "s"})`}
          </Row>
          <Row done={s.beacon.deployed} locked={!landed}>Deploy the navigation beacon</Row>
          <Row done={s.reported} locked={!s.beacon.deployed}>Report to Mission Control at the ladder</Row>
        </ul>
      </div>
      <div>
        <div className="hud-label mb-1.5 flex items-center gap-1">
          <Star className="size-3 text-amber" aria-hidden /> Optional
        </div>
        <ul className="space-y-1.5">
          <Row done={notes === NOTE_IDS.length}>Science notes read ({notes}/{NOTE_IDS.length})</Row>
          <Row done={s.sampleCollected} locked={!landed}>Regolith sample from the crater rim</Row>
        </ul>
        {isOptionalComplete(s.notesRead, s.sampleCollected) && <p className="mt-1 text-xs text-success">Bonus objective complete</p>}
      </div>
    </div>
  );
}
