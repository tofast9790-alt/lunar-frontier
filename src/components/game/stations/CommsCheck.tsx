import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { completeCheck, missionStore, useMission } from "@/game/missions/mission01/state";
import { cn } from "@/lib/utils";
import { ConfirmBar, ScienceNote, Step } from "./parts";

const CHANNELS = [1, 2, 3, 4];
const TARGET = 3;
/** One-way light time at average Earth–Moon distance (384,400 km / 299,792 km/s). */
const ONE_WAY_MS = 1282;

export function CommsCheck({ onClose }: { onClose: () => void }) {
  const done = useMission().checks.comms;
  const [pre] = useState(() => missionStore.get().checks.comms);
  const [channel, setChannel] = useState<number | null>(pre ? TARGET : null);
  const [tx, setTx] = useState<"idle" | "running" | "done">(pre ? "done" : "idle");
  const [elapsed, setElapsed] = useState(pre ? ONE_WAY_MS * 2 : 0);
  const raf = useRef(0);

  useEffect(() => {
    if (tx !== "running") return;
    const start = performance.now();
    const tick = (t: number) => {
      const e = Math.min(ONE_WAY_MS * 2, t - start);
      setElapsed(e);
      if (e >= ONE_WAY_MS * 2) setTx("done");
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [tx]);

  const locked = channel === TARGET;
  const outbound = elapsed <= ONE_WAY_MS;
  const pos = outbound ? elapsed / ONE_WAY_MS : 1 - (elapsed - ONE_WAY_MS) / ONE_WAY_MS;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The simulator emulates a link across the average Earth–Moon distance (~384,400 km). Tune in to Mission Control and time a radio check.
      </p>
      <ol className="space-y-2">
        <Step n={1} title="Tune to MCC-PRIMARY (channel 3)" done={locked} active>
          <div className="flex flex-wrap items-center gap-2">
            {CHANNELS.map((c) => (
              <Button
                key={c}
                size="sm"
                variant="hud"
                data-autofocus={c === 1 && !locked ? true : undefined}
                aria-pressed={channel === c}
                className={cn(channel === c && (c === TARGET ? "border-success text-success" : "border-destructive text-destructive"))}
                onClick={() => setChannel(c)}
              >
                CH {c}
              </Button>
            ))}
            <span className="w-full text-xs">
              {channel === null && <span className="text-muted-foreground">Select a channel.</span>}
              {channel !== null && !locked && <span className="text-destructive">CH {channel}: static, no carrier. Try another channel.</span>}
              {locked && <span className="text-success">Carrier locked on MCC-PRIMARY.</span>}
            </span>
          </div>
        </Step>
        <Step n={2} title="Transmit a radio check and time the reply" done={tx === "done"} active={locked}>
          <div className="space-y-3">
            <div className="relative h-10 rounded-md border border-border bg-muted/40 px-6">
              <span className="absolute top-1/2 left-1 -translate-y-1/2 font-mono text-[10px] text-primary">EARTH</span>
              <span className="absolute top-1/2 right-1 -translate-y-1/2 font-mono text-[10px] text-muted-foreground">MOON</span>
              <div className="absolute inset-x-12 top-1/2 h-px bg-border" />
              <div
                className={cn("absolute top-1/2 size-3 -translate-y-1/2 rounded-full", outbound ? "bg-amber" : "bg-primary")}
                style={{ left: `calc(3rem + (100% - 6rem) * ${1 - pos})` }}
                aria-hidden
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {tx === "idle" && (
                <Button variant="hud" size="sm" onClick={() => setTx("running")}>
                  Transmit: "Mission Control, radio check."
                </Button>
              )}
              <span className="font-mono text-sm">
                {(elapsed / 1000).toFixed(2)} s <span className="sim-tag">sim</span>
              </span>
              {tx === "running" && <span className="text-xs text-muted-foreground">{outbound ? "Your signal is travelling…" : "Reply on its way back…"}</span>}
            </div>
            {tx === "done" && (
              <p className="text-success">
                “Loud and clear, Commander.” Round trip ≈ {(ONE_WAY_MS * 2 / 1000).toFixed(2)} s — the reply can't arrive faster than light can travel there and back.
              </p>
            )}
          </div>
        </Step>
      </ol>
      <ScienceNote id="comms" />
      <ConfirmBar
        ready={locked && tx === "done"}
        done={done}
        label="Confirm comms check"
        onConfirm={() => completeCheck("comms")}
        onClose={onClose}
      />
    </div>
  );
}
