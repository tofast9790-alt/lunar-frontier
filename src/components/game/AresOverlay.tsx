import { Button } from "@/components/ui/button";
import { INTERACTABLES, STATION_TITLES } from "@/game/missions/mission01/data";
import { allChecksDone, isOptionalComplete } from "@/game/missions/mission01/scoring";
import { useMission, type MissionState } from "@/game/missions/mission01/state";
import { STATION_IDS } from "@/game/missions/mission01/types";
import { cn } from "@/lib/utils";
import { OverlayFrame } from "./OverlayFrame";
import { Portrait } from "./Portrait";

const DIRECTIONS: Record<string, string> = {
  suit: "north-west corner",
  oxygen: "north-east corner",
  comms: "south-west corner",
  emergency: "south-east, near the supply crates",
};

export function aresHint(s: MissionState): string {
  const next = STATION_IDS.find((id) => !s.checks[id]);
  if (next) return `Next recommended check: ${STATION_TITLES[next]} in the ${DIRECTIONS[next]}. Look for the amber ring on the floor.`;
  if (!s.quiz.passed)
    return `All equipment verified. The ${INTERACTABLES.terminal.label} is on the east wall beside the airlock. You need 2 of 3 answers to pass.`;
  if (!isOptionalComplete(s.notesRead, s.boardInspected))
    return "Launch authorization is within reach. For a bonus, read every science note and acknowledge the checklist board on the north wall.";
  return "All objectives complete, Commander. Use the terminal to proceed to mission evaluation.";
}

export function AresOverlay({ onClose }: { onClose: () => void }) {
  const s = useMission();
  const systems: [string, boolean][] = [
    ["Suit pressure integrity", s.checks.suit],
    ["Primary + backup O₂", s.checks.oxygen],
    ["CO₂ scrubber", s.checks.oxygen],
    ["Comms link (MCC)", s.checks.comms],
    ["Emergency kit", s.checks.emergency],
    ["Certification", s.quiz.passed],
  ];
  return (
    <OverlayFrame kicker="Robotic assistant" title="ARES — hints & diagnostics" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Portrait speaker="ares" className="h-16 w-16" />
          <p className="text-sm leading-relaxed">{aresHint(s)}</p>
        </div>
        <div>
          <div className="hud-label mb-2">Diagnostic status</div>
          <ul className="grid gap-1.5 font-mono text-xs sm:grid-cols-2">
            {systems.map(([label, ok]) => (
              <li key={label} className="flex items-center justify-between rounded border border-border px-2 py-1.5">
                <span>{label}</span>
                <span className={cn(ok ? "text-success" : "text-amber")}>{ok ? "VERIFIED" : "PENDING"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Launch authorization: {allChecksDone(s.checks) && s.quiz.passed ? "GRANTED" : "requires all checks + quiz pass"}
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
