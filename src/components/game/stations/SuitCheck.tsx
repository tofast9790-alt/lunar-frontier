import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeCheck, missionStore, useMission } from "@/game/missions/mission01/state";
import { ConfirmBar, Gauge, ScienceNote, Step } from "./parts";

const SEALS = [
  { id: "helmet", label: "Helmet neck ring", result: "Latched — locking indicators aligned." },
  { id: "gloves", label: "Glove wrist disconnects", result: "Both gloves locked, no gaps." },
  { id: "waist", label: "Waist & boot seals", result: "Seated and latched." },
];
const TARGET_KPA = 29.6;

export function SuitCheck({ onClose }: { onClose: () => void }) {
  const done = useMission().checks.suit;
  const [pre] = useState(() => missionStore.get().checks.suit);
  const [seals, setSeals] = useState<string[]>(pre ? SEALS.map((s) => s.id) : []);
  const [pressure, setPressure] = useState(pre ? TARGET_KPA : 0);
  const [pressurizing, setPressurizing] = useState(false);
  const [leak, setLeak] = useState<"idle" | "running" | "pass">(pre ? "pass" : "idle");

  const sealsDone = seals.length === SEALS.length;
  const pressureDone = pressure >= TARGET_KPA;

  useEffect(() => {
    if (!pressurizing) return;
    const id = window.setInterval(() => {
      setPressure((p) => {
        const next = Math.min(TARGET_KPA, p + 1.6);
        if (next >= TARGET_KPA) setPressurizing(false);
        return next;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [pressurizing]);

  useEffect(() => {
    if (leak !== "running") return;
    const id = window.setTimeout(() => setLeak("pass"), 1600);
    return () => window.clearTimeout(id);
  }, [leak]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Your suit must hold pressure before it can protect you. Inspect each seal, pressurise the suit, then run a leak check.
      </p>
      <ol className="space-y-2">
        <Step n={1} title="Inspect the three suit seals" done={sealsDone} active>
          <div className="grid gap-2 sm:grid-cols-3">
            {SEALS.map((s) => {
              const ok = seals.includes(s.id);
              return (
                <Button
                  key={s.id}
                  variant="choice"
                  className="p-2 text-xs"
                  data-autofocus={!ok && seals.length === 0 && s.id === "helmet" ? true : undefined}
                  onClick={() => !ok && setSeals((x) => [...x, s.id])}
                  aria-pressed={ok}
                >
                  <span>
                    <span className="block font-semibold">{s.label}</span>
                    <span className={ok ? "text-success" : "text-muted-foreground"}>{ok ? s.result : "Tap to inspect"}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        </Step>
        <Step n={2} title="Pressurise the suit" done={pressureDone} active={sealsDone}>
          <div className="space-y-2">
            <Gauge label="Suit pressure" value={pressure} max={35} unit="kPa" tone={pressureDone ? "success" : "cyan"} />
            {!pressureDone && (
              <Button variant="hud" size="sm" disabled={pressurizing} onClick={() => setPressurizing(true)}>
                {pressurizing ? "Pressurising…" : `Pressurise to ${TARGET_KPA} kPa`}
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Target ≈ 29.6 kPa (4.3 psi), a typical spacewalk-suit pressure — about 30% of sea-level air.
            </p>
          </div>
        </Step>
        <Step n={3} title="Run leak check" done={leak === "pass"} active={pressureDone}>
          {leak === "pass" ? (
            <p className="text-success">Pressure stable for the hold period. No leaks detected. <span className="sim-tag">sim</span></p>
          ) : (
            <Button variant="hud" size="sm" disabled={leak === "running"} onClick={() => setLeak("running")}>
              {leak === "running" ? "Holding pressure…" : "Start leak check"}
            </Button>
          )}
        </Step>
      </ol>
      <ScienceNote id="suit" />
      <ConfirmBar
        ready={sealsDone && pressureDone && leak === "pass"}
        done={done}
        label="Confirm suit check"
        onConfirm={() => completeCheck("suit")}
        onClose={onClose}
      />
    </div>
  );
}
