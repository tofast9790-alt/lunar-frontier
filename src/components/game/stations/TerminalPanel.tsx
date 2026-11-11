import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATION_TITLES } from "@/game/missions/mission01/data";
import { allChecksDone } from "@/game/missions/mission01/scoring";
import { openOverlay, setPhase, useMission } from "@/game/missions/mission01/state";
import { STATION_IDS } from "@/game/missions/mission01/types";

export function TerminalPanel({ onClose }: { onClose: () => void }) {
  const s = useMission();
  const ready = allChecksDone(s.checks);
  if (!ready) {
    const missing = STATION_IDS.filter((id) => !s.checks[id]);
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-amber">
          <Lock className="size-4" aria-hidden /> Certification locked
        </p>
        <p className="text-sm text-muted-foreground">Complete these equipment checks first:</p>
        <ul className="list-inside list-disc space-y-1 text-sm">
          {missing.map((id) => (
            <li key={id}>{STATION_TITLES[id]}</li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button variant="hud" onClick={onClose} data-autofocus>
            Return to Prep Bay
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm">
        Three questions based on the stations you inspected. You need <strong>2 of 3</strong> to pass. You can retry as many times as you need.
      </p>
      {s.quiz.attempts > 0 && (
        <p className="font-mono text-xs text-muted-foreground">
          Attempts: {s.quiz.attempts} · Best: {s.quiz.bestCorrect}/3 · {s.quiz.passed ? "PASSED" : "NOT YET PASSED"}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        {s.quiz.passed ? (
          <>
            <Button variant="hud" onClick={() => openOverlay({ kind: "quiz" })}>
              Retake for a better score
            </Button>
            <Button variant="mission" data-autofocus onClick={() => setPhase("evaluation")}>
              Proceed to mission evaluation
            </Button>
          </>
        ) : (
          <Button variant="mission" data-autofocus onClick={() => openOverlay({ kind: "quiz" })}>
            {s.quiz.attempts > 0 ? "Retry certification quiz" : "Begin certification quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
