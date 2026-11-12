import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MISSION_02, SITES } from "@/game/missions/mission02/data";
import { MAX_SCORE, isOptionalComplete, rankFor } from "@/game/missions/mission02/scoring";
import { currentScore, finalizeMission02, setPhase, useM02 } from "@/game/missions/mission02/state";
import { NOTE_IDS } from "@/game/missions/mission02/types";
import { Portrait } from "../Portrait";

const REPORT = [
  "With almost no atmosphere, a lunar lander can only slow down by firing its engine against gravity — and hovering burns fuel without getting you any closer to the ground.",
  "Landing radar measures height by timing a radio echo: distance = (speed of light × time) ÷ 2.",
  "Star trackers keep the guidance system pointed correctly where there is no GPS.",
  "Good polar landing sites balance gentle slopes, few boulders, long sunlight and a view of Earth — close to, but not inside, the icy shadowed craters.",
  "At the poles the Sun skims the horizon, so solar panels stand upright and face it across the ground.",
];

export function M02EvaluationScreen() {
  const s = useM02();
  const score = currentScore(s);
  const optional = isOptionalComplete(s.notesRead, s.sampleCollected);
  const landing = s.descent.landing;
  const l = score.landing;
  const site = s.site.chosen ? SITES[s.site.chosen] : null;
  const rows: [string, string, number][] = [
    ["Pre-descent checks", "3 × 60", score.cockpit],
    ["Landing site", site ? `Site ${site.letter}${s.site.wrongPicks ? ` · ${s.site.wrongPicks} wrong pick${s.site.wrongPicks === 1 ? "" : "s"}` : " · first choice"}` : "—", score.site],
    ["Safe landing", s.descent.failures ? `${s.descent.failures} abort${s.descent.failures === 1 ? "" : "s"}` : "first attempt", l.base],
    ["Precision", landing ? `${landing.distance.toFixed(1)} m from centre` : "—", l.precision],
    ["Soft touchdown", landing ? `${landing.vs.toFixed(2)} m/s down` : "—", l.softness],
    ["Fuel reserve", landing ? `${landing.fuel.toFixed(0)}% left` : "—", l.fuel],
    ["Navigation beacon", s.beacon.mistakes ? `${s.beacon.mistakes} power-check fail${s.beacon.mistakes === 1 ? "" : "s"}` : "first try", score.beacon],
    ["Optional objective", optional ? "complete" : `notes ${NOTE_IDS.filter((i) => s.notesRead[i]).length}/${NOTE_IDS.length} · sample ${s.sampleCollected ? "✓" : "—"}`, score.optional],
  ];

  return (
    <div className="starfield h-full w-full overflow-y-auto">
      <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-8 lg:grid-cols-2">
        <header className="lg:col-span-2">
          <div className="hud-label text-primary">{MISSION_02.code} · Mission evaluation</div>
          <h1 className="text-3xl font-bold sm:text-4xl">Touchdown Review</h1>
        </header>

        <section className="panel space-y-3 p-5">
          <h2 className="hud-label">Score</h2>
          <dl className="space-y-1.5 text-sm">
            {rows.map(([k, detail, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3">
                <dt>
                  {k}
                  <span className="block text-xs text-muted-foreground">{detail}</span>
                </dt>
                <dd className="font-mono">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <dt>Total</dt>
              <dd className="font-mono text-amber">
                {score.total} / {MAX_SCORE}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-primary">Rating: {rankFor(score.total)}</p>
          <p className="text-xs text-muted-foreground">
            <span className="sim-tag mr-1">sim</span> Landing figures come from the game's simplified flight model.
          </p>
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

          <div className="panel glow-cyan space-y-3 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-8 text-success" aria-hidden />
              <div>
                <div className="hud-label">Outpost site</div>
                <div className="font-display text-2xl font-bold text-success">BEACON ONLINE</div>
              </div>
            </div>
            <div className="flex gap-3 rounded-md bg-panel-strong p-3">
              <Portrait speaker="elena" className="h-12 w-12" />
              <p className="text-sm">
                {optional
                  ? "A clean landing, a working beacon and a sample for the lab. Commander, that is how you open an outpost."
                  : "You're down safely and the beacon is guiding the next landers in. If you want the bonus, the rim sample and science notes are still out there."}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="hud" onClick={() => setPhase("surface")}>
                Back to the surface
              </Button>
              <Button
                variant="mission"
                size="xl"
                autoFocus
                onClick={() => {
                  if (finalizeMission02()) setPhase("complete");
                }}
              >
                Transmit final report
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
