import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_SLOPE_DEG, SITES } from "@/game/missions/mission02/data";
import { pickSite, setPhase, useM02 } from "@/game/missions/mission02/state";
import { SITE_IDS, type SiteId } from "@/game/missions/mission02/types";
import { cn } from "@/lib/utils";
import { M02Note } from "./CockpitChecks";
import { M02Comms, M02TopBar } from "./M02Hud";

type Tone = "good" | "warn" | "bad";
const toneClass: Record<Tone, string> = { good: "text-success", warn: "text-amber", bad: "text-destructive" };

function rows(id: SiteId): [string, string, Tone][] {
  const s = SITES[id];
  return [
    ["Ground slope", `${s.slopeDeg}° (limit ${MAX_SLOPE_DEG}°)`, s.slopeDeg <= MAX_SLOPE_DEG ? "good" : "bad"],
    ["Boulders", s.boulders, s.boulders === "low" ? "good" : s.boulders === "medium" ? "warn" : "bad"],
    ["Sunlight (solar power)", `${s.sunlightPct}% of the time`, s.sunlightPct >= 70 ? "good" : s.sunlightPct > 0 ? "warn" : "bad"],
    ["Earth in view (radio)", s.earthVisible ? "yes" : "no", s.earthVisible ? "good" : "bad"],
    ["Distance to shadowed ice", s.iceKm === 0 ? "on top of it" : `${s.iceKm} km`, s.iceKm !== null && s.iceKm <= 5 ? "good" : "warn"],
  ];
}

/** Stylised 2D orbital map of the south polar landing area. */
function SiteMap({ selected, rejected, chosen, onSelect }: { selected: SiteId; rejected: SiteId[]; chosen: SiteId | null; onSelect: (id: SiteId) => void }) {
  const boulderDots = [
    [14, 64], [18, 74], [25, 66], [28, 76], [20, 80], [12, 70], [26, 62], [30, 70], [16, 60], [23, 72],
  ];
  return (
    <svg viewBox="0 0 100 100" className="aspect-square w-full rounded-md border border-border bg-muted" role="group" aria-label="Orbital map of candidate landing sites">
      <rect width="100" height="100" className="fill-muted" />
      {/* craters */}
      {[[30, 22, 9], [86, 74, 8], [10, 36, 6], [52, 88, 7], [88, 46, 5]].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r! + 1} className="fill-foreground/10" />
          <circle cx={x} cy={y} r={r} className="fill-background/50" />
        </g>
      ))}
      {/* far-rim crater with steep slope */}
      <circle cx="82" cy="18" r="13" className="fill-background/60 stroke-foreground/20" strokeWidth="0.6" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={70 + i * 2} y1={30 - i} x2={73 + i * 2} y2={25 - i} className="stroke-foreground/30" strokeWidth="0.5" />
      ))}
      {/* permanently shadowed crater */}
      <circle cx="61" cy="62" r="18" className="fill-foreground/15" />
      <circle cx="61" cy="62" r="16" className="fill-background" />
      <text x="61" y="76" textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="2.6">PERMANENT SHADOW · ICE?</text>
      {/* boulder field */}
      {boulderDots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.9} className="fill-foreground/60" />
      ))}
      {/* sun + earth indicators */}
      <g className="fill-amber">
        <circle cx="4" cy="50" r="2.4" />
        <text x="8" y="47" fontSize="2.8" className="font-mono">SUN · low on horizon (west)</text>
      </g>
      <g className="fill-primary">
        <text x="50" y="5" textAnchor="middle" fontSize="2.8" className="font-mono">↑ EARTH (map-grid north, low)</text>
      </g>
      {SITE_IDS.map((id) => {
        const s = SITES[id];
        const isSel = selected === id;
        const isRej = rejected.includes(id);
        const isChosen = chosen === id;
        return (
          <g
            key={id}
            role="button"
            tabIndex={0}
            aria-label={`Site ${s.letter}: ${s.name}`}
            aria-pressed={isSel}
            className="cursor-pointer outline-none"
            onClick={() => onSelect(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(id);
              }
            }}
          >
            <circle cx={s.mapX} cy={s.mapY} r={6} className="fill-transparent" />
            <circle
              cx={s.mapX}
              cy={s.mapY}
              r={isSel ? 4.2 : 3.4}
              className={cn(
                "stroke-[0.8]",
                isChosen ? "fill-success/30 stroke-success" : isRej ? "fill-destructive/20 stroke-destructive" : isSel ? "fill-amber/30 stroke-amber" : "fill-background/60 stroke-amber/80",
              )}
            />
            <text x={s.mapX} y={s.mapY + 1.1} textAnchor="middle" fontSize="3.2" className={cn("font-display font-bold", isRej ? "fill-destructive" : isChosen ? "fill-success" : "fill-amber")}>
              {s.letter}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SiteScreen() {
  const s = useM02();
  const [selected, setSelected] = useState<SiteId>(s.site.chosen ?? "plateau");
  const [feedback, setFeedback] = useState<SiteId | null>(s.site.chosen);
  const site = SITES[selected];
  const chosen = s.site.chosen;
  const isRejected = s.site.rejected.includes(selected);

  return (
    <div className="starfield relative h-full w-full overflow-hidden bg-background">
      <M02TopBar place="Orbit · site selection" />
      <div className="h-full overflow-y-auto px-3 pt-20 pb-44 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_1fr]">
          <section className="panel space-y-2 p-4">
            <div className="hud-label">Orbital survey · tap a site</div>
            <SiteMap selected={selected} rejected={s.site.rejected} chosen={chosen} onSelect={(id) => setSelected(id)} />
            <p className="text-xs text-muted-foreground">
              Map simplified for gameplay <span className="sim-tag">sim</span>. Sites rejected in this run are marked red.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <div className="panel space-y-3 p-5">
              <div className="hud-label text-primary">Site {site.letter}</div>
              <h2 className="text-2xl font-semibold">{site.name}</h2>
              <dl className="space-y-1.5 text-sm">
                {rows(selected).map(([k, v, tone]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-border/60 pb-1">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className={cn("font-mono", toneClass[tone])}>{v}</dd>
                  </div>
                ))}
              </dl>

              {feedback === selected && (chosen === selected || isRejected) && (
                <p
                  className={cn(
                    "rounded-md border p-3 text-sm",
                    chosen === selected ? "border-success/50 bg-success/10 text-success" : "border-destructive/50 bg-destructive/10",
                  )}
                >
                  {chosen !== selected && <X className="mr-1 inline size-4 text-destructive" aria-hidden />}
                  {site.verdict}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {chosen ? (
                  <Button variant="mission" size="xl" autoFocus onClick={() => setPhase("descent")}>
                    Begin powered descent <ChevronRight aria-hidden />
                  </Button>
                ) : (
                  <Button
                    variant="mission"
                    size="xl"
                    disabled={isRejected}
                    onClick={() => {
                      pickSite(selected);
                      setFeedback(selected);
                    }}
                  >
                    {isRejected ? `Site ${site.letter} rejected` : `Land at Site ${site.letter}`}
                  </Button>
                )}
              </div>
              {!chosen && (
                <p className="text-right text-xs text-muted-foreground">
                  Each wrong pick costs points. Wrong picks so far: {s.site.wrongPicks}
                </p>
              )}
            </div>
            <M02Note id="site" />
          </section>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
        <div className="pointer-events-auto w-full max-w-md">
          <M02Comms />
        </div>
      </div>
    </div>
  );
}
