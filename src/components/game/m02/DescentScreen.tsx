import { ArrowRight, Flame, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setVirtualThrust } from "@/game/core/input";
import { DESCENT, FAILURE_TEXT, initialDescent } from "@/game/missions/mission02/descent";
import { SITES } from "@/game/missions/mission02/data";
import { beginDescent, retryDescent, setPhase, toTelemetry, useM02 } from "@/game/missions/mission02/state";
import { PhaserGame } from "@/game/phaser/PhaserGame";
import { useSave } from "@/game/persistence/save";
import { cn } from "@/lib/utils";
import { Gauge } from "../stations/parts";
import { TouchPad } from "../TouchPad";
import { M02Comms, M02TopBar } from "./M02Hud";

const START = toTelemetry(initialDescent());

function Readout({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className="rounded border border-border bg-panel-strong/60 px-2 py-1.5">
      <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{label}</div>
      <div
        className={cn(
          "font-mono text-lg leading-tight tabular-nums",
          tone === "good" && "text-success",
          tone === "warn" && "text-amber",
          tone === "bad" && "text-destructive",
        )}
      >
        {value}
        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

/** Hold-to-fire main engine button for mouse / touch players. */
function ThrustButton() {
  const off = () => setVirtualThrust(false);
  return (
    <button
      type="button"
      aria-label="Main engine (hold)"
      className="panel flex h-24 w-24 touch-none flex-col items-center justify-center gap-1 rounded-full font-display text-sm font-semibold text-amber select-none active:bg-amber/25"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setVirtualThrust(true);
      }}
      onPointerUp={off}
      onPointerCancel={off}
      onLostPointerCapture={off}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Flame aria-hidden />
      Thrust
    </button>
  );
}

export function DescentScreen() {
  const s = useM02();
  const { settings } = useSave();
  const d = s.descent;
  const t = d.telemetry ?? START;
  const down = Math.max(0, -t.vs);
  const vsTone = down <= DESCENT.maxVs ? "good" : t.alt < 80 ? "bad" : "warn";
  const hsTone = t.hs <= DESCENT.maxHs ? "good" : t.alt < 60 ? "bad" : "warn";
  const distTone = t.distance <= DESCENT.lzRadius ? "good" : "warn";
  const fuelTone = t.fuel > 40 ? "cyan" : t.fuel > 15 ? "amber" : "amber";
  const result = d.lastResult;
  const site = s.site.chosen ? SITES[s.site.chosen] : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <PhaserGame key={`${s.runId}-${d.attempt}`} scene="descent" />
      <M02TopBar place="Powered descent" />

      {/* Telemetry */}
      <aside className="panel absolute top-20 left-3 z-10 w-56 space-y-2 p-3" aria-label="Descent telemetry" aria-live="off">
        <div className="flex items-center justify-between">
          <span className="hud-label text-foreground">Telemetry</span>
          <span className="sim-tag">sim</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Readout label="Altitude" value={t.alt.toFixed(0)} unit="m" />
          <Readout label="Down speed" value={down.toFixed(1)} unit="m/s" tone={vsTone} />
          <Readout label="Sideways" value={t.hs.toFixed(1)} unit="m/s" tone={hsTone} />
          <div className="rounded border border-border bg-panel-strong/60 px-2 py-1.5">
            <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">To LZ</div>
            <div className={cn("flex items-center gap-1 font-mono text-lg leading-tight tabular-nums", distTone === "good" ? "text-success" : "text-amber")}>
              {t.distance.toFixed(0)}
              <span className="text-xs text-muted-foreground">m</span>
              {t.distance > 2 && (
                <ArrowRight className="ml-auto size-4" style={{ transform: `rotate(${t.bearing}rad)` }} aria-label="Direction to landing zone" />
              )}
            </div>
          </div>
        </div>
        <Gauge label="FUEL" value={t.fuel} max={DESCENT.fuelMax} unit="%" tone={fuelTone} sim={false} />
        <div className="rounded border border-amber/40 bg-amber/5 p-2 font-mono text-[11px] leading-relaxed">
          <div className="text-amber">Touchdown limits</div>
          Down ≤ {DESCENT.maxVs.toFixed(1)} · Side ≤ {DESCENT.maxHs.toFixed(1)} m/s
          <br />
          Inside {DESCENT.lzRadius} m ring
        </div>
        {d.failures > 0 && <p className="text-xs text-muted-foreground">Attempt {d.attempt + 1} · aborts: {d.failures}</p>}
      </aside>

      {/* Lander computer callout */}
      {d.callout && d.status === "flying" && (
        <div className="pointer-events-none absolute top-20 left-1/2 z-10 w-[min(32rem,calc(100%-17rem))] -translate-x-1/2 max-md:top-auto max-md:bottom-56 max-md:left-auto max-md:right-3 max-md:w-56 max-md:translate-x-0">
          <div key={d.callout} className="panel animate-fade-up px-3 py-2 text-center font-mono text-sm text-primary" role="status">
            {d.callout}
          </div>
        </div>
      )}

      {/* Ready card */}
      {d.status === "ready" && s.overlay === null && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background/40 p-4">
          <div className="panel glow-cyan w-full max-w-md space-y-3 p-5">
            <div className="hud-label text-primary">{d.attempt === 0 ? "Go for powered descent" : `Attempt ${d.attempt + 1}`}</div>
            <h2 className="text-2xl font-semibold">Target: {site ? `Site ${site.letter} — ${site.name}` : "landing zone"}</h2>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                You start {DESCENT.startAlt} m up, falling and drifting. The view zooms in as the ground gets closer.
              </li>
              <li>
                <span className="text-foreground">Hold Space</span> (or the Thrust button) to fire the main engine against gravity.
              </li>
              <li>
                <span className="text-foreground">WASD / arrows</span> fire side thrusters. Steer toward the cyan ring and stop drifting before touchdown.
              </li>
              <li>Fuel is tight: don't hover high up — save it for the last 50 m.</li>
            </ul>
            <Button
              variant="mission"
              size="xl"
              className="w-full"
              autoFocus
              onClick={(e) => {
                e.currentTarget.blur();
                beginDescent();
              }}
            >
              Begin descent
            </Button>
          </div>
        </div>
      )}

      {/* Result */}
      {(d.status === "landed" || d.status === "failed") && result && s.overlay === null && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background/50 p-4">
          <div className={cn("panel w-full max-w-md space-y-3 p-5 animate-fade-up", result.ok ? "glow-cyan" : "glow-amber")} role="alert">
            <div className="flex items-center gap-3">
              {result.ok ? <ShieldCheck className="size-8 text-success" aria-hidden /> : <ShieldAlert className="size-8 text-amber" aria-hidden />}
              <div>
                <div className="hud-label">{result.ok ? "Contact light" : "Abort to orbit"}</div>
                <h2 className={cn("font-display text-2xl font-bold", result.ok ? "text-success" : "text-amber")}>
                  {result.ok ? "The lander has landed" : "Landing aborted"}
                </h2>
              </div>
            </div>
            {!result.ok && result.reason && <p className="text-sm">{FAILURE_TEXT[result.reason]}</p>}
            <dl className="grid grid-cols-2 gap-1.5 font-mono text-xs">
              <div className="rounded border border-border px-2 py-1">
                <dt className="text-muted-foreground">Down speed</dt>
                <dd className={result.vs <= DESCENT.maxVs ? "text-success" : "text-destructive"}>{result.vs.toFixed(2)} m/s</dd>
              </div>
              <div className="rounded border border-border px-2 py-1">
                <dt className="text-muted-foreground">Sideways</dt>
                <dd className={result.hs <= DESCENT.maxHs ? "text-success" : "text-destructive"}>{result.hs.toFixed(2)} m/s</dd>
              </div>
              <div className="rounded border border-border px-2 py-1">
                <dt className="text-muted-foreground">From LZ centre</dt>
                <dd className={result.distance <= DESCENT.lzRadius ? "text-success" : "text-destructive"}>{result.distance.toFixed(1)} m</dd>
              </div>
              <div className="rounded border border-border px-2 py-1">
                <dt className="text-muted-foreground">Fuel left</dt>
                <dd>{result.fuel.toFixed(0)}%</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              <span className="sim-tag mr-1">sim</span> Simplified flight model; real landers burn far more propellant from much higher up.
            </p>
            {result.ok ? (
              <Button variant="mission" size="xl" className="w-full" autoFocus onClick={() => setPhase("surface")}>
                Step outside
              </Button>
            ) : (
              <Button
                variant="mission"
                size="xl"
                className="w-full"
                autoFocus
                onClick={(e) => {
                  e.currentTarget.blur();
                  retryDescent();
                }}
              >
                <RotateCcw aria-hidden /> Retry descent
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Comms + controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col-reverse gap-2 p-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="pointer-events-auto w-full max-w-md">
          <M02Comms />
        </div>
        <div className="pointer-events-auto flex flex-col items-end gap-2 self-end">
          <div className="flex items-end gap-3">
            {settings.showTouchPad && <TouchPad />}
            <ThrustButton />
          </div>
          <p className="panel hidden px-2 py-1 font-mono text-[11px] text-muted-foreground xl:block">
            Space engine · WASD/Arrows thrusters · H ARES · Esc pause
          </p>
        </div>
      </div>
    </div>
  );
}
