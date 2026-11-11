import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCIENCE_NOTES } from "@/game/missions/mission02/data";
import { completeCockpitCheck, m02Store, markNoteRead, useM02 } from "@/game/missions/mission02/state";
import type { CockpitCheckId, NoteId } from "@/game/missions/mission02/types";
import { cn } from "@/lib/utils";
import { ConfirmBar, Gauge, NoteCard, Step } from "../stations/parts";

export function M02Note({ id }: { id: NoteId }) {
  const read = useM02().notesRead[id];
  return <NoteCard note={SCIENCE_NOTES[id]} read={read} onOpen={() => markNoteRead(id)} />;
}

interface Choice {
  id: string;
  text: string;
  correct?: boolean;
  why: string;
}

/** One multiple-choice question with instant feedback; wrong answers can be retried. */
function ChoiceQuestion({ prompt, choices, solved, onSolved }: { prompt: string; choices: Choice[]; solved: boolean; onSolved: () => void }) {
  const [picked, setPicked] = useState<string | null>(solved ? (choices.find((c) => c.correct)?.id ?? null) : null);
  const choice = choices.find((c) => c.id === picked);
  return (
    <div className="space-y-2">
      <p>{prompt}</p>
      <div className="grid gap-1.5">
        {choices.map((c) => (
          <Button
            key={c.id}
            variant="choice"
            size="sm"
            className={cn("py-2", picked === c.id && (c.correct ? "border-success text-success" : "border-destructive text-destructive"))}
            aria-pressed={picked === c.id}
            disabled={solved && !c.correct}
            onClick={() => {
              setPicked(c.id);
              if (c.correct) onSolved();
            }}
          >
            {c.text}
          </Button>
        ))}
      </div>
      {choice && <p className={cn("text-xs", choice.correct ? "text-success" : "text-destructive")}>{choice.why}</p>}
    </div>
  );
}

const usePre = (id: CockpitCheckId) => useState(() => m02Store.get().cockpit[id])[0];

// ------------------------------------------------------------------ engine
export function EngineCheck({ onClose }: { onClose: () => void }) {
  const done = useM02().cockpit.engine;
  const pre = usePre("engine");
  const [press, setPress] = useState(pre ? 100 : 0);
  const [pressing, setPressing] = useState(false);
  const [armed, setArmed] = useState(pre);
  const [answered, setAnswered] = useState(pre);

  useEffect(() => {
    if (!pressing) return;
    const id = window.setInterval(() => {
      setPress((p) => {
        const n = Math.min(100, p + 5);
        if (n >= 100) setPressing(false);
        return n;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [pressing]);

  const pressurised = press >= 100;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The descent engine is your only brake. Make sure it can fire — and that you understand what it costs.</p>
      <ol className="space-y-2">
        <Step n={1} title="Pressurise the propellant tanks" done={pressurised} active>
          <div className="space-y-2">
            <Gauge label="Tank pressure" value={press} max={100} unit="%" tone={pressurised ? "success" : "cyan"} />
            {!pressurised && (
              <Button variant="hud" size="sm" data-autofocus disabled={pressing} onClick={() => setPressing(true)}>
                {pressing ? "Pressurising…" : "Open helium pressurant valve"}
              </Button>
            )}
            {pressurised && <p className="text-xs text-success">Tanks at flight pressure. Propellant 100% <span className="sim-tag">sim</span></p>}
          </div>
        </Step>
        <Step n={2} title="Arm the descent engine" done={armed} active={pressurised}>
          {armed ? (
            <p className="text-xs text-success">Engine ARMED. Full throttle burns about 2.2% of fuel per second <span className="sim-tag">sim</span></p>
          ) : (
            <Button variant="hud" size="sm" onClick={() => setArmed(true)}>
              Engine arm switch → ARM
            </Button>
          )}
        </Step>
        <Step n={3} title="Fuel budget question" done={answered} active={armed}>
          <ChoiceQuestion
            prompt="Why does hovering high above the ground waste fuel?"
            solved={answered}
            onSolved={() => setAnswered(true)}
            choices={[
              { id: "air", text: "Air resistance slows the lander down.", why: "The Moon has almost no air — that's exactly why the engine must do all the braking." },
              { id: "grav", text: "The engine must push against gravity the whole time, even when you're not getting lower.", correct: true, why: "Right. Gravity never switches off, so every second of hovering burns fuel without bringing you closer." },
              { id: "heat", text: "The engine overheats when it hovers.", why: "Not the main issue. The problem is fighting gravity every second you spend in the air." },
            ]}
          />
        </Step>
      </ol>
      <M02Note id="engine" />
      <ConfirmBar
        ready={pressurised && armed && answered}
        done={done}
        label="Engine & propellant GO"
        onConfirm={() => completeCockpitCheck("engine")}
        onClose={onClose}
        returnLabel="Back to systems"
      />
    </div>
  );
}

// ------------------------------------------------------------------- radar
export function RadarCheck({ onClose }: { onClose: () => void }) {
  const done = useM02().cockpit.radar;
  const pre = usePre("radar");
  const [state, setState] = useState<"off" | "testing" | "on">(pre ? "on" : "off");
  const [answered, setAnswered] = useState(pre);

  useEffect(() => {
    if (state !== "testing") return;
    const id = window.setTimeout(() => setState("on"), 1400);
    return () => window.clearTimeout(id);
  }, [state]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">The landing radar tells you how high you are. Long polar shadows make height almost impossible to judge by eye.</p>
      <ol className="space-y-2">
        <Step n={1} title="Power on and self-test" done={state === "on"} active>
          {state === "on" ? (
            <p className="text-xs text-success">Radar self-test passed. Echo returns locked.</p>
          ) : (
            <Button variant="hud" size="sm" data-autofocus disabled={state === "testing"} onClick={() => setState("testing")}>
              {state === "testing" ? "Self-test running…" : "Radar power → ON"}
            </Button>
          )}
        </Step>
        <Step n={2} title="Read the echo" done={answered} active={state === "on"}>
          <div className="space-y-2">
            <div className="rounded border border-primary/30 bg-panel-strong p-2 font-mono text-xs">
              Pulse sent → echo received after <span className="text-primary">2.0 µs</span> (millionths of a second)
              <div className="text-muted-foreground">Radio speed ≈ 300 m per µs</div>
            </div>
            <ChoiceQuestion
              prompt="How high is the lander above the test target?"
              solved={answered}
              onSolved={() => setAnswered(true)}
              choices={[
                { id: "600", text: "600 m", why: "That's the whole round trip (300 × 2). The pulse goes down AND back up — divide by two." },
                { id: "300", text: "300 m", correct: true, why: "Correct: 300 m/µs × 2.0 µs = 600 m there and back, so the ground is 300 m away." },
                { id: "150", text: "150 m", why: "Too low. Distance = (speed × time) ÷ 2 = (300 × 2) ÷ 2." },
              ]}
            />
          </div>
        </Step>
      </ol>
      <M02Note id="radar" />
      <ConfirmBar
        ready={state === "on" && answered}
        done={done}
        label="Landing radar GO"
        onConfirm={() => completeCockpitCheck("radar")}
        onClose={onClose}
        returnLabel="Back to systems"
      />
    </div>
  );
}

// ---------------------------------------------------------------- guidance
const TOLERANCE = 4;

/** Rotate the live star-tracker view until its stars sit inside the catalogue circles. */
function StarField({ seed, offset, onAligned, aligned }: { seed: number; offset: number; onAligned: () => void; aligned: boolean }) {
  const [angle, setAngle] = useState(aligned ? offset : 0);
  const stars = useMemo(() => {
    const out: { r: number; a: number; s: number }[] = [];
    let x = seed;
    const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 6; i++) out.push({ r: 22 + rnd() * 50, a: rnd() * Math.PI * 2, s: 1.6 + rnd() * 2.2 });
    return out;
  }, [seed]);
  const diff = Math.abs((((angle - offset) % 360) + 540) % 360 - 180);
  const close = diff <= TOLERANCE;
  const rot = ((offset - angle) * Math.PI) / 180;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="-80 -80 160 160" className="h-36 w-36 shrink-0 rounded-full border border-primary/40 bg-background" aria-hidden>
        <line x1="-80" y1="0" x2="80" y2="0" className="stroke-primary/20" />
        <line x1="0" y1="-80" x2="0" y2="80" className="stroke-primary/20" />
        {stars.map((st, i) => (
          <circle key={`c${i}`} cx={Math.cos(st.a) * st.r} cy={Math.sin(st.a) * st.r} r={6} className="fill-none stroke-amber/70" strokeDasharray="2 2" />
        ))}
        {stars.map((st, i) => (
          <circle key={`s${i}`} cx={Math.cos(st.a + rot) * st.r} cy={Math.sin(st.a + rot) * st.r} r={st.s} className={close || aligned ? "fill-success" : "fill-foreground"} />
        ))}
      </svg>
      <div className="min-w-48 flex-1 space-y-2">
        <label className="block text-xs text-muted-foreground">
          Rotate tracker view: <span className="font-mono text-foreground">{angle}°</span>
          <input
            type="range"
            min={0}
            max={359}
            value={angle}
            disabled={aligned}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="mt-1 block w-full accent-[var(--amber)]"
            aria-label="Star tracker rotation"
          />
        </label>
        <p className={cn("font-mono text-xs", aligned ? "text-success" : close ? "text-success" : "text-muted-foreground")}>
          {aligned ? "Alignment marked." : close ? "Pattern match — within tolerance." : `Off by ${Math.round(diff)}° — match stars to the dashed circles.`}
        </p>
        {!aligned && (
          <Button variant="hud" size="sm" disabled={!close} onClick={onAligned}>
            Mark alignment
          </Button>
        )}
      </div>
    </div>
  );
}

export function GuidanceCheck({ onClose }: { onClose: () => void }) {
  const done = useM02().cockpit.guidance;
  const pre = usePre("guidance");
  const [a, setA] = useState(pre);
  const [b, setB] = useState(pre);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The guidance platform has drifted slightly since launch. Re-align it on two star fields so the computer knows exactly which way is down.
      </p>
      <ol className="space-y-2">
        <Step n={1} title="Star field 1" done={a} active>
          <StarField seed={11} offset={137} aligned={a} onAligned={() => setA(true)} />
        </Step>
        <Step n={2} title="Star field 2" done={b} active={a}>
          <StarField seed={57} offset={248} aligned={b} onAligned={() => setB(true)} />
        </Step>
      </ol>
      {a && b && (
        <p className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 className="size-4" aria-hidden /> Platform aligned. Pointing error under 0.01° <span className="sim-tag">sim</span>
        </p>
      )}
      <M02Note id="guidance" />
      <ConfirmBar ready={a && b} done={done} label="Guidance GO" onConfirm={() => completeCockpitCheck("guidance")} onClose={onClose} returnLabel="Back to systems" />
    </div>
  );
}
