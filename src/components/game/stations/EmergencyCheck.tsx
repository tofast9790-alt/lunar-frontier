import { useState } from "react";
import { Button } from "@/components/ui/button";
import { completeCheck, missionStore, useMission } from "@/game/missions/mission01/state";
import { ConfirmBar, ScienceNote, Step } from "./parts";

const ITEMS = [
  { id: "o2", label: "Emergency O₂ bottle", detail: "Sealed, gauge in green band." },
  { id: "med", label: "Medical kit", detail: "Complete, within expiry." },
  { id: "beacon", label: "Locator beacon", detail: "Battery charged, self-test OK." },
  { id: "tether", label: "Safety tether", detail: "No fraying, hooks lock." },
  { id: "patch", label: "Suit patch kit", detail: "Patches and sealant present." },
];

/** Correct order of the (simplified, fictional) emergency procedure card. */
const PROCEDURE = [
  "Stop and stabilise yourself",
  "Report your status to Mission Control",
  "Check suit pressure and oxygen readouts",
  "Return to the nearest safe haven",
];
const DISPLAY_ORDER = [2, 0, 3, 1];

export function EmergencyCheck({ onClose }: { onClose: () => void }) {
  const done = useMission().checks.emergency;
  const [pre] = useState(() => missionStore.get().checks.emergency);
  const [inspected, setInspected] = useState<string[]>(pre ? ITEMS.map((i) => i.id) : []);
  const [order, setOrder] = useState<number[]>(pre ? [0, 1, 2, 3] : []);
  const [error, setError] = useState<string | null>(null);

  const itemsDone = inspected.length === ITEMS.length;
  const orderDone = order.length === PROCEDURE.length;

  const pick = (idx: number) => {
    if (order.includes(idx)) return;
    if (idx === order.length) {
      setOrder((o) => [...o, idx]);
      setError(null);
    } else {
      setOrder([]);
      setError(`"${PROCEDURE[idx]}" isn't step ${order.length + 1}. Hint: make yourself safe before anything else, then talk to Mission Control. Start again.`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Inspect each item in the emergency kit, then rebuild the procedure card in the right order.
      </p>
      <ol className="space-y-2">
        <Step n={1} title={`Inspect kit contents (${inspected.length}/${ITEMS.length})`} done={itemsDone} active>
          <div className="grid gap-2 sm:grid-cols-2">
            {ITEMS.map((it, i) => {
              const ok = inspected.includes(it.id);
              return (
                <Button
                  key={it.id}
                  variant="choice"
                  className="p-2 text-xs"
                  data-autofocus={i === 0 && !ok ? true : undefined}
                  aria-pressed={ok}
                  onClick={() => !ok && setInspected((x) => [...x, it.id])}
                >
                  <span>
                    <span className="block font-semibold">{it.label}</span>
                    <span className={ok ? "text-success" : "text-muted-foreground"}>{ok ? it.detail : "Tap to inspect"}</span>
                  </span>
                </Button>
              );
            })}
          </div>
        </Step>
        <Step n={2} title="Put the procedure card steps in order" done={orderDone} active={itemsDone}>
          <div className="space-y-2">
            <ol className="space-y-1">
              {PROCEDURE.map((_, i) => (
                <li key={i} className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  {order[i] !== undefined ? <span className="text-success">{PROCEDURE[order[i]]}</span> : <span className="text-muted-foreground">———</span>}
                </li>
              ))}
            </ol>
            {!orderDone && (
              <div className="grid gap-2 sm:grid-cols-2">
                {DISPLAY_ORDER.map((idx) => (
                  <Button key={idx} variant="choice" className="p-2 text-xs" disabled={order.includes(idx)} onClick={() => pick(idx)}>
                    {PROCEDURE[idx]}
                  </Button>
                ))}
              </div>
            )}
            {error && <p className="text-xs text-amber">{error}</p>}
            <p className="text-xs text-muted-foreground"><span className="sim-tag mr-1">simplified</span>Training procedure created for this game.</p>
          </div>
        </Step>
      </ol>
      <ScienceNote id="emergency" />
      <ConfirmBar
        ready={itemsDone && orderDone}
        done={done}
        label="Confirm emergency kit check"
        onConfirm={() => completeCheck("emergency")}
        onClose={onClose}
      />
    </div>
  );
}
