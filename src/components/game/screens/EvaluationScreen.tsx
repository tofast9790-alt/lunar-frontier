import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MISSION_01, STATION_TITLES } from "@/game/missions/mission01/data";
import { MAX_SCORE, isLaunchAuthorized, isOptionalComplete, rankFor } from "@/game/missions/mission01/scoring";
import { currentScore, finalizeMission, setPhase, useMission } from "@/game/missions/mission01/state";
import { STATION_IDS } from "@/game/missions/mission01/types";
import { Portrait } from "../Portrait";
import { cn } from "@/lib/utils";

const REPORT = [
  "A spacesuit is a personal spacecraft: it maintains pressure, supplies oxygen, regulates temperature and protects the wearer.",
  "Oxygen supply and CO₂ removal are separate life-support functions — both must work, and a backup O₂ supply covers emergencies.",
  "Radio signals travel at light speed, so Earth–Moon messages take about 1.3 s each way; farther destinations mean longer delays.",
  "Prepared supplies and practised, ordered checklists reduce risk when something goes wrong.",
];

export function EvaluationScreen() {
  const s = useMission();
  const authorized = isLaunchAuthorized(s.checks, s.quiz);
  const optional = isOptionalComplete(s.notesRead, s.boardInspected);
  const score = currentScore(s);

  return (
    <div className="starfield h-full w-full overflow-y-auto">
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8 lg:grid-cols-2">
        <header className="lg:col-span-2">
          <div className="hud-label text-primary">{MISSION_01.code} · Mission evaluation</div>
          <h1 className="text-3xl font-bold sm:text-4xl">Readiness Review</h1>
        </header>

        <section className="panel space-y-4 p-5">
          <h2 className="hud-label">Equipment checklist</h2>
          <ul className="space-y-1.5">
            {STATION_IDS.map((id) => (
              <li key={id} className={cn("flex items-center gap-2 text-sm", s.checks[id] ? "text-success" : "text-amber")}>
                <CheckCircle2 className="size-4" aria-hidden /> {STATION_TITLES[id]} — {s.checks[id] ? "verified" : "incomplete"}
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border border-border p-3">
              <div className="hud-label">Quiz</div>
              <div className="font-display text-2xl">{s.quiz.bestCorrect}/3</div>
              <div className="text-xs text-muted-foreground">
                {s.quiz.passed ? "Passed" : "Not passed"} · {s.quiz.attempts} attempt{s.quiz.attempts === 1 ? "" : "s"}
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="hud-label">Optional objective</div>
              <div className={cn("font-display text-lg", optional ? "text-success" : "text-muted-foreground")}>
                {optional ? "Complete" : "Not complete"}
              </div>
              <div className="text-xs text-muted-foreground">
                Notes {STATION_IDS.filter((i) => s.notesRead[i]).length}/4 · Board {s.boardInspected ? "✓" : "—"}
              </div>
            </div>
          </div>
          <div>
            <h2 className="hud-label mb-2">Score</h2>
            <dl className="space-y-1 font-mono text-sm">
              {[
                ["Equipment checks", score.checks],
                ["Quiz answers (best attempt)", score.quiz],
                ["First-try pass bonus", score.firstTry],
                ["Optional objective", score.optional],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-1 text-base">
                <dt>Total</dt>
                <dd className="text-amber">
                  {score.total} / {MAX_SCORE}
                </dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-primary">Rating: {rankFor(score.total)}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="panel space-y-2 p-5">
            <h2 className="hud-label">Science report</h2>
            <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed">
              {REPORT.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>

          <div className={cn("panel space-y-3 p-5", authorized ? "glow-cyan" : "glow-amber")}>
            <div className="flex items-center gap-3">
              {authorized ? (
                <ShieldCheck className="size-8 text-success" aria-hidden />
              ) : (
                <ShieldAlert className="size-8 text-amber" aria-hidden />
              )}
              <div>
                <div className="hud-label">Launch authorization</div>
                <div className={cn("font-display text-2xl font-bold", authorized ? "text-success" : "text-amber")}>
                  {authorized ? "AUTHORIZED" : "NOT AUTHORIZED"}
                </div>
              </div>
            </div>
            <div className="flex gap-3 rounded-md bg-panel-strong p-3">
              <Portrait speaker="elena" className="h-12 w-12" />
              <p className="text-sm">
                {authorized
                  ? optional
                    ? "Outstanding preparation, Commander — every check, every note. You are go for launch."
                    : "You're cleared, Commander. If you want the bonus, the science notes and checklist board are still waiting in the Prep Bay."
                  : "Not yet. Every equipment check and a quiz pass are required before I sign off."}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="hud" onClick={() => setPhase("training")}>
                Return to Prep Bay
              </Button>
              <Button
                variant="mission"
                size="xl"
                disabled={!authorized}
                autoFocus={authorized}
                onClick={() => {
                  finalizeMission();
                  setPhase("launch");
                }}
              >
                Begin launch sequence
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
