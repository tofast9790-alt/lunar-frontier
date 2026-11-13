import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { MISSIONS, PLANNED_MISSION_COUNT, missionRecordState } from "@/game/missions/registry";
import { MAX_SCORE as M01_MAX } from "@/game/missions/mission01/scoring";
import { MAX_SCORE as M02_MAX } from "@/game/missions/mission02/scoring";

const MAX_SCORES: Record<string, number> = { m01: M01_MAX, m02: M02_MAX };
import { useSave } from "@/game/persistence/save";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Mission Records — Lunar Frontier" },
      { name: "description", content: "Your Lunar Frontier campaign progress: completed missions, best scores and upcoming missions." },
      { property: "og:title", content: "Mission Records — Lunar Frontier" },
      { property: "og:description", content: "Track your progress through the Lunar Frontier campaign." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Records,
});

function Records() {
  const save = useSave();
  const completed = Object.fromEntries(Object.entries(save.missions).map(([id, m]) => [id, m.completed]));
  return (
    <PageShell kicker="Campaign progress" title="Mission Records">
      <ul className="space-y-3">
        {MISSIONS.map((m) => {
          const state = missionRecordState(m, completed);
          const rec = save.missions[m.id];
          return (
            <li
              key={m.id}
              className={cn("panel flex flex-wrap items-center gap-4 p-5", state === "locked" && "opacity-70")}
            >
              <div
                className={cn(
                  "grid size-12 place-items-center rounded-md border",
                  state === "completed" ? "border-success text-success" : state === "unlocked" ? "border-amber text-amber" : "border-border text-muted-foreground",
                )}
              >
                {state === "completed" ? <CheckCircle2 aria-hidden /> : state === "unlocked" ? <PlayCircle aria-hidden /> : <Lock aria-hidden />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="hud-label">
                  Mission {String(m.number).padStart(2, "0")} · {m.chapter}
                </div>
                <h2 className="text-xl font-semibold">{m.title}</h2>
                <p className="text-sm text-muted-foreground">{m.summary}</p>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    "font-mono text-xs uppercase tracking-wider",
                    state === "completed" ? "text-success" : state === "unlocked" ? "text-amber" : "text-muted-foreground",
                  )}
                >
                  {state === "locked" && m.availability === "in-development" ? "Locked · in development" : state}
                </div>
                {rec?.completed && (
                  <div className="mt-1 text-sm">
                    Best <span className="font-display text-lg text-amber">{rec.bestScore}</span>
                    <span className="text-muted-foreground">/{MAX_SCORES[m.id] ?? 1000}</span>
                    <div className="text-xs text-muted-foreground">Completed {rec.timesCompleted}×</div>
                  </div>
                )}
                {state !== "locked" && (
                  <Button variant="mission" size="sm" className="mt-2" asChild>
                    <Link to={m.path}>{state === "completed" ? "Replay" : "Play"}</Link>
                  </Button>
                )}
                {state === "locked" && m.availability === "playable" && m.requires && (
                  <div className="mt-1 text-xs text-muted-foreground">Complete Mission {m.requires.replace("m", "")} to unlock</div>
                )}
              </div>
            </li>
          );
        })}
        <li className="panel border-dashed p-5 text-sm text-muted-foreground">
          Missions 03–{PLANNED_MISSION_COUNT}: planned for the full Moon campaign. Not yet available.
        </li>
      </ul>
    </PageShell>
  );
}
