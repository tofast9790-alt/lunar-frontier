import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearMovement, isEditableTarget, setVirtualThrust } from "@/game/core/input";
import { MISSIONS, missionRecordState } from "@/game/missions/registry";
import {
  closeOverlay,
  m02Store,
  openOverlay,
  startMission02,
  useM02,
} from "@/game/missions/mission02/state";
import { loadSave, useSave } from "@/game/persistence/save";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { CockpitScreen } from "@/components/game/m02/CockpitScreen";
import { DescentScreen } from "@/components/game/m02/DescentScreen";
import { M02AresOverlay } from "@/components/game/m02/M02AresOverlay";
import { M02BriefingScreen } from "@/components/game/m02/M02BriefingScreen";
import { M02CompleteScreen } from "@/components/game/m02/M02CompleteScreen";
import { M02EvaluationScreen } from "@/components/game/m02/M02EvaluationScreen";
import { M02IntroScreen } from "@/components/game/m02/M02IntroScreen";
import { SiteScreen } from "@/components/game/m02/SiteScreen";
import { SurfacePanel } from "@/components/game/m02/SurfacePanels";
import { SurfaceScreen, interactSurface } from "@/components/game/m02/SurfaceScreen";

export const Route = createFileRoute("/mission-02")({
  head: () => ({
    meta: [
      { title: "Mission 02: Touchdown — Lunar Frontier" },
      {
        name: "description",
        content:
          "Play Mission 02 of Lunar Frontier: run pre-descent checks, choose a safe polar landing site, fly a top-down landing and plant a navigation beacon.",
      },
      { property: "og:title", content: "Mission 02: Touchdown — Lunar Frontier" },
      { property: "og:description", content: "A challenging 2D top-down lunar landing at the south pole, with unlimited retries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Mission02Page,
});

const M02_META = MISSIONS.find((m) => m.id === "m02")!;
const PLAY_PHASES = new Set(["cockpit", "site", "descent", "surface"]);
const PAUSABLE_PHASES = new Set(["briefing", ...PLAY_PHASES]);

/** Close a panel and drop focus so Enter/Space don't re-trigger the last button. */
function closePanel() {
  closeOverlay();
  (document.activeElement as HTMLElement | null)?.blur?.();
}

function Mission02Page() {
  const save = useSave();
  const [ready, setReady] = useState(false);

  // The root loads the save in its own effect, which runs after this child's; load here too (idempotent).
  useEffect(() => {
    loadSave();
    setReady(true);
  }, []);

  const completed = Object.fromEntries(Object.entries(save.missions).map(([id, m]) => [id, m.completed]));
  const unlocked = missionRecordState(M02_META, completed) !== "locked";

  if (!ready) return <main className="h-[100dvh] w-full bg-background" aria-busy="true" />;
  if (!unlocked) return <LockedNotice />;
  return <Mission02Game />;
}

function LockedNotice() {
  return (
    <main className="starfield grid min-h-[100dvh] place-items-center p-6">
      <section className="panel max-w-md space-y-4 p-6 text-center">
        <Lock className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-3xl font-bold">Mission 02 is locked</h1>
        <p className="text-sm text-muted-foreground">
          Finish Mission 01 — The Selection to earn launch authorization. Touchdown unlocks as soon as you complete it.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="mission" size="xl" asChild>
            <Link to="/play">Play Mission 01</Link>
          </Button>
          <Button variant="hud" size="xl" asChild>
            <Link to="/">Main menu</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function Mission02Game() {
  const s = useM02();

  // Fresh run each time the player enters the mission.
  useEffect(() => {
    startMission02("intro");
    return () => {
      clearMovement();
      setVirtualThrust(false);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const st = m02Store.get();
      if (e.code === "Escape") {
        e.preventDefault();
        if (st.overlay) closePanel();
        else if (PAUSABLE_PHASES.has(st.phase)) {
          clearMovement();
          openOverlay({ kind: "pause" });
        }
        return;
      }
      if (!PLAY_PHASES.has(st.phase) || st.overlay || e.repeat) return;
      if (e.code === "KeyE" && st.phase === "surface" && st.nearby) {
        e.preventDefault();
        clearMovement();
        interactSurface(st.nearby);
      } else if (e.code === "KeyH") {
        e.preventDefault();
        clearMovement();
        openOverlay({ kind: "ares" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const o = s.overlay;
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-background">
      {s.phase === "intro" && <M02IntroScreen />}
      {s.phase === "briefing" && <M02BriefingScreen />}
      {s.phase === "cockpit" && <CockpitScreen />}
      {s.phase === "site" && <SiteScreen />}
      {s.phase === "descent" && <DescentScreen />}
      {s.phase === "surface" && <SurfaceScreen />}
      {s.phase === "evaluation" && <M02EvaluationScreen />}
      {s.phase === "complete" && <M02CompleteScreen />}

      {o?.kind === "surface" && <SurfacePanel key={o.id} id={o.id} onClose={closePanel} />}
      {o?.kind === "ares" && <M02AresOverlay onClose={closePanel} />}
      {o?.kind === "pause" && (
        <PauseOverlay
          onResume={closePanel}
          onRestart={() => startMission02("briefing")}
          missionCode="Mission 02"
          legend={
            <p className="font-mono text-xs text-muted-foreground">
              Landing: hold Space (or the Thrust button) for the main engine · WASD/Arrows side thrusters · H ARES · Esc pause
            </p>
          }
        />
      )}
    </main>
  );
}
