import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeCheck, missionStore, useMission } from "@/game/missions/mission01/state";
import { cn } from "@/lib/utils";
import { ConfirmBar, Gauge, ScienceNote, Step } from "./parts";

type Sys = "oxygen" | "scrubber";
const FUNCTIONS: { id: string; text: string; answer: Sys }[] = [
  { id: "supply", text: "Supplies breathable oxygen", answer: "oxygen" },
  { id: "remove", text: "Removes the CO₂ you breathe out", answer: "scrubber" },
];

export function OxygenCheck({ onClose }: { onClose: () => void }) {
  const done = useMission().checks.oxygen;
  const [pre] = useState(() => missionStore.get().checks.oxygen);
  const [primary, setPrimary] = useState(pre);
  const [backup, setBackup] = useState<"idle" | "on" | "returned">(pre ? "returned" : "idle");
  const [co2, setCo2] = useState(pre ? 15 : 68);
  const [scrub, setScrub] = useState<"idle" | "running" | "done">(pre ? "done" : "idle");
  const [answers, setAnswers] = useState<Record<string, Sys | undefined>>(
    pre ? { supply: "oxygen", remove: "scrubber" } : {},
  );

  useEffect(() => {
    if (scrub !== "running") return;
    const id = window.setInterval(() => {
      setCo2((c) => {
        const n = Math.max(15, c - 4);
        if (n <= 15) setScrub("done");
        return n;
      });
    }, 90);
    return () => window.clearInterval(id);
  }, [scrub]);

  const classified = FUNCTIONS.every((f) => answers[f.id] === f.answer);
  const tanksDone = primary && backup === "returned";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Life support has two separate jobs: supply oxygen, and remove carbon dioxide. Verify both, plus the emergency backup.
      </p>
      <ol className="space-y-2">
        <Step n={1} title="Verify primary and backup oxygen" done={tanksDone} active>
          <div className="space-y-3">
            <div className="space-y-2">
              <Gauge label="Primary O₂ tank" value={primary ? 98 : 0} max={100} unit="%" />
              {!primary && (
                <Button variant="hud" size="sm" data-autofocus onClick={() => setPrimary(true)}>
                  Read primary tank
                </Button>
              )}
              {primary && <p className="text-xs text-success">Primary reads 98% — about 8 h of use. <span className="sim-tag">sim</span></p>}
            </div>
            {primary && (
              <div className="space-y-2">
                <Gauge label="Emergency backup O₂" value={backup === "idle" ? 0 : 100} max={100} unit="%" tone="amber" />
                {backup === "idle" && (
                  <Button variant="hud" size="sm" onClick={() => setBackup("on")}>
                    Switch to backup supply
                  </Button>
                )}
                {backup === "on" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-amber">Backup flowing: ~30 min reserve. <span className="sim-tag">sim</span></span>
                    <Button variant="hud" size="sm" onClick={() => setBackup("returned")}>
                      Return to primary
                    </Button>
                  </div>
                )}
                {backup === "returned" && <p className="text-xs text-success">Backup tested and closed. Running on primary.</p>}
              </div>
            )}
          </div>
        </Step>
        <Step n={2} title="Test CO₂ removal (scrubber)" done={scrub === "done"} active={tanksDone}>
          <div className="space-y-2">
            <Gauge label="CO₂ build-up in suit loop" value={co2} max={100} unit="% of limit" tone={co2 > 40 ? "amber" : "success"} />
            {scrub !== "done" && (
              <Button variant="hud" size="sm" disabled={scrub === "running"} onClick={() => setScrub("running")}>
                {scrub === "running" ? "Scrubbing…" : "Activate scrubber"}
              </Button>
            )}
            {scrub === "done" && <p className="text-xs text-success">Scrubber holding CO₂ well below the safety limit.</p>}
          </div>
        </Step>
        <Step n={3} title="Match each job to the right system" done={classified} active={scrub === "done"}>
          <div className="space-y-2">
            {FUNCTIONS.map((f) => {
              const a = answers[f.id];
              const wrong = a !== undefined && a !== f.answer;
              return (
                <div key={f.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-48 flex-1">{f.text}</span>
                  {(["oxygen", "scrubber"] as Sys[]).map((sys) => (
                    <Button
                      key={sys}
                      size="sm"
                      variant="hud"
                      aria-pressed={a === sys}
                      className={cn(a === sys && (a === f.answer ? "border-success text-success" : "border-destructive text-destructive"))}
                      onClick={() => setAnswers((x) => ({ ...x, [f.id]: sys }))}
                    >
                      {sys === "oxygen" ? "O₂ supply" : "CO₂ scrubber"}
                    </Button>
                  ))}
                  {wrong && (
                    <p className="w-full text-xs text-destructive">
                      Not quite — oxygen comes from the tanks; the scrubber filters out exhaled CO₂. Try again.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Step>
      </ol>
      <ScienceNote id="oxygen" />
      <ConfirmBar
        ready={tanksDone && scrub === "done" && classified}
        done={done}
        label="Confirm oxygen check"
        onConfirm={() => completeCheck("oxygen")}
        onClose={onClose}
      />
    </div>
  );
}
