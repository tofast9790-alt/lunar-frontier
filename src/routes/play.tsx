import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { isEditableTarget, clearMovement } from "@/game/core/input";
import {
  closeOverlay,
  missionStore,
  openOverlay,
  startMission,
  useMission,
} from "@/game/missions/mission01/state";
import { AresOverlay } from "@/components/game/AresOverlay";
import { PauseOverlay } from "@/components/game/PauseOverlay";
import { QuizOverlay } from "@/components/game/QuizOverlay";
import { StationOverlay } from "@/components/game/StationOverlay";
import { BriefingScreen } from "@/components/game/screens/BriefingScreen";
import { CompleteScreen } from "@/components/game/screens/CompleteScreen";
import { EvaluationScreen } from "@/components/game/screens/EvaluationScreen";
import { IntroScreen } from "@/components/game/screens/IntroScreen";
import { LaunchScreen } from "@/components/game/screens/LaunchScreen";
import { TrainingScreen, interactWith } from "@/components/game/screens/TrainingScreen";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Mission 01: The Selection — Lunar Frontier" },
      {
        name: "description",
        content: "Play Mission 01 of Lunar Frontier: inspect your spacesuit, oxygen, comms and emergency kit, pass certification and launch.",
      },
      { property: "og:title", content: "Mission 01: The Selection — Lunar Frontier" },
      { property: "og:description", content: "A playable 2D lunar mission prep: four equipment checks, a quiz and launch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayPage,
});

/** Close a panel and drop focus so Enter/Space don't re-trigger the last button. */
function closePanel() {
  closeOverlay();
  (document.activeElement as HTMLElement | null)?.blur?.();
}

function PlayPage() {
  const s = useMission();

  // Fresh run each time the player enters the mission.
  useEffect(() => {
    startMission("intro");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const st = missionStore.get();
      if (e.code === "Escape") {
        e.preventDefault();
        if (st.overlay) closePanel();
        else if (st.phase !== "complete") {
          clearMovement();
          openOverlay({ kind: "pause" });
        }
        return;
      }
      if (st.phase !== "training" || st.overlay || e.repeat) return;
      if (e.code === "KeyE" && st.nearby) {
        e.preventDefault();
        clearMovement();
        interactWith(st.nearby);
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
      {s.phase === "intro" && <IntroScreen />}
      {s.phase === "briefing" && <BriefingScreen />}
      {s.phase === "training" && <TrainingScreen />}
      {s.phase === "evaluation" && <EvaluationScreen />}
      {s.phase === "launch" && <LaunchScreen />}
      {s.phase === "complete" && <CompleteScreen />}

      {o?.kind === "station" && <StationOverlay key={o.id} id={o.id} onClose={closePanel} />}
      {o?.kind === "quiz" && <QuizOverlay onClose={closePanel} />}
      {o?.kind === "ares" && <AresOverlay onClose={closePanel} />}
      {o?.kind === "pause" && <PauseOverlay />}
    </main>
  );
}
