import { CheckCircle2, Circle, Lock, Star } from "lucide-react";
import { STATION_TITLES } from "@/game/missions/mission01/data";
import { allChecksDone, checksDone, isOptionalComplete } from "@/game/missions/mission01/scoring";
import type { MissionState } from "@/game/missions/mission01/state";
import { STATION_IDS } from "@/game/missions/mission01/types";
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

export function ObjectiveList({ state, compact }: { state: MissionState; compact?: boolean }) {
  const all = allChecksDone(state.checks);
  const notes = STATION_IDS.filter((id) => state.notesRead[id]).length;
  return (
    <div className="space-y-3">
      <div>
        <div className="hud-label mb-1.5">Primary · {checksDone(state.checks)}/4 checks</div>
        <ul className="space-y-1.5">
          {STATION_IDS.map((id) => (
            <Row key={id} done={state.checks[id]}>
              {STATION_TITLES[id]}
            </Row>
          ))}
          <Row done={state.quiz.passed} locked={!all}>
            Certification quiz {state.quiz.attempts > 0 && `(best ${state.quiz.bestCorrect}/3)`}
            {!all && !compact && <span className="block text-xs">Unlocks after all four checks</span>}
          </Row>
        </ul>
      </div>
      <div>
        <div className="hud-label mb-1.5 flex items-center gap-1">
          <Star className="size-3 text-amber" aria-hidden /> Optional
        </div>
        <ul className="space-y-1.5">
          <Row done={notes === 4}>Science notes read ({notes}/4)</Row>
          <Row done={state.boardInspected}>Mission checklist board</Row>
        </ul>
        {isOptionalComplete(state.notesRead, state.boardInspected) && (
          <p className="mt-1 text-xs text-success">Bonus objective complete</p>
        )}
      </div>
    </div>
  );
}
