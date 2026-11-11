import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOARD_LINES } from "@/game/missions/mission01/data";
import { inspectBoard, useMission } from "@/game/missions/mission01/state";
import { STATION_IDS } from "@/game/missions/mission01/types";

export function BoardPanel({ onClose }: { onClose: () => void }) {
  const s = useMission();
  const notes = STATION_IDS.filter((id) => s.notesRead[id]).length;
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {BOARD_LINES.map((l, i) => (
          <li key={l} className="flex gap-3 rounded-md border border-border bg-panel-strong p-2.5 text-sm">
            <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
            {l}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Optional objective: acknowledge this board and read all four science notes ({notes}/4 read).
      </p>
      {s.boardInspected ? (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" aria-hidden /> Checklist acknowledged
          </span>
          <Button variant="hud" onClick={onClose} data-autofocus>
            Return to Prep Bay
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button variant="mission" onClick={inspectBoard} data-autofocus>
            Acknowledge checklist
          </Button>
        </div>
      )}
    </div>
  );
}
