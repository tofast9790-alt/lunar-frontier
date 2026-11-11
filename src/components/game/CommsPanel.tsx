import { useState } from "react";
import { ChevronRight, Radio, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPEAKER_NAMES } from "@/game/missions/mission01/dialogue";
import { advanceComms, useMission } from "@/game/missions/mission01/state";
import { Portrait } from "./Portrait";
import { useTypewriter } from "./Typewriter";
import { cn } from "@/lib/utils";

/** Non-blocking comms panel: the player can keep moving while messages play. */
export function CommsPanel() {
  const { commsQueue, commsLog } = useMission();
  const [showLog, setShowLog] = useState(false);
  const line = commsQueue[0];
  const { shown, done, finish } = useTypewriter(line?.text ?? "");

  if (showLog) {
    return (
      <section className="panel w-full max-w-md p-3" aria-label="Comms log">
        <div className="mb-2 flex items-center justify-between">
          <span className="hud-label">Comms log</span>
          <Button variant="ghost" size="sm" onClick={() => setShowLog(false)}>
            Close log
          </Button>
        </div>
        <ol className="max-h-52 space-y-2 overflow-y-auto pr-1 text-sm">
          {commsLog.length === 0 && <li className="text-muted-foreground">No transmissions yet.</li>}
          {commsLog.map((l) => (
            <li key={l.id}>
              <span className={cn("font-mono text-xs", l.speaker === "ares" ? "text-primary" : "text-amber")}>
                {SPEAKER_NAMES[l.speaker]}
              </span>
              <p className="text-foreground/90">{l.text}</p>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (!line) {
    return (
      <div className="flex items-center gap-2">
        <span className="panel flex items-center gap-2 px-3 py-2 font-mono text-xs text-muted-foreground">
          <Radio className="size-3.5 text-success" aria-hidden /> Comms link nominal
        </span>
        {commsLog.length > 0 && (
          <Button variant="hud" size="sm" onClick={() => setShowLog(true)}>
            <ScrollText aria-hidden /> Log
          </Button>
        )}
      </div>
    );
  }

  return (
    <section className="panel w-full max-w-md p-3 animate-fade-up" aria-live="polite" aria-label="Incoming transmission">
      <div className="flex gap-3">
        <Portrait speaker={line.speaker} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("font-mono text-[11px] uppercase tracking-wider", line.speaker === "ares" ? "text-primary" : "text-amber")}>
              {SPEAKER_NAMES[line.speaker]}
            </span>
            {commsQueue.length > 1 && <span className="hud-label">+{commsQueue.length - 1}</span>}
          </div>
          <p className="mt-1 min-h-[3.75rem] text-sm leading-relaxed">{shown}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowLog(true)}>
          Log
        </Button>
        <Button
          variant="hud"
          size="sm"
          onClick={(e) => {
            if (!done) finish();
            else advanceComms();
            e.currentTarget.blur();
          }}
        >
          {done ? (commsQueue.length > 1 ? "Next" : "Dismiss") : "Skip text"} <ChevronRight aria-hidden />
        </Button>
      </div>
    </section>
  );
}
