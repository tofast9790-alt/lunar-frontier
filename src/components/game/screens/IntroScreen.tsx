import { useCallback, useEffect, useState } from "react";
import { ChevronRight, SkipForward } from "lucide-react";
import outpostImg from "@/assets/intro-outpost.jpg";
import elenaImg from "@/assets/intro-elena.jpg";
import aresImg from "@/assets/intro-ares.jpg";
import { Button } from "@/components/ui/button";
import { isEditableTarget } from "@/game/core/input";
import { missionStore, setPhase } from "@/game/missions/mission01/state";
import type { Speaker } from "@/game/missions/mission01/types";
import { SPEAKER_NAMES } from "@/game/missions/mission01/dialogue";
import { cn } from "@/lib/utils";
import { CommanderInsignia } from "../CommanderInsignia";
import { useTypewriter } from "../Typewriter";

interface Panel {
  kicker: string;
  title: string;
  image?: string;
  speaker?: Speaker;
  text: string;
}

const PANELS: Panel[] = [
  {
    kicker: "Year 2042",
    title: "A new beginning",
    image: outpostImg,
    text: "Humanity is preparing a sustainable research outpost near the Moon's south polar region, where long-shadowed craters may hold water ice that future crews could use.",
  },
  {
    kicker: "Selection board decision",
    title: "You have been chosen",
    text: "After months of evaluation, the Lunar Frontier selection board has made its decision. You will command the first crew rotation to the south polar outpost.",
  },
  {
    kicker: "Mission Control · incoming",
    title: "Dr. Elena",
    image: elenaImg,
    speaker: "elena",
    text: "Congratulations, Commander. I'm Dr. Elena, your flight director at Mission Control. Before we put you on a rocket, I need to be certain you understand the equipment that will keep you alive.",
  },
  {
    kicker: "Robotic support · online",
    title: "ARES",
    image: aresImg,
    speaker: "ares",
    text: "Greetings, Commander. I am ARES — Autonomous Robotic Exploration Support. I will provide hints and diagnostics. The decisions, however, are yours.",
  },
];

export function IntroScreen() {
  const [i, setI] = useState(0);
  const panel = PANELS[i] ?? PANELS[0]!;
  const last = i === PANELS.length - 1;
  const { shown, done, finish } = useTypewriter(panel.text, 22);

  const advance = useCallback(() => {
    if (!done) return finish();
    if (last) setPhase("briefing");
    else setI((n) => n + 1);
  }, [done, finish, last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A focused button already handles Enter/Space itself — don't double-advance.
      if (isEditableTarget(e.target) || e.target instanceof HTMLButtonElement) return;
      if (missionStore.get().overlay) return;
      if (e.code === "Enter" || e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div key={i} className="absolute inset-0 animate-fade-up">
        {panel.image ? (
          <img src={panel.image} alt="" className="animate-kenburns h-full w-full object-cover" width={1600} height={912} />
        ) : (
          <div className="starfield animate-drift grid h-full w-full place-items-center">
            <CommanderInsignia className="h-56 w-56 sm:h-72 sm:w-72" />
          </div>
        )}
        <div className="image-fade-bottom absolute inset-0" />
      </div>

      <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
        <div className="flex gap-1.5" aria-label={`Panel ${i + 1} of ${PANELS.length}`}>
          {PANELS.map((_, n) => (
            <span key={n} className={cn("h-1 w-8 rounded-full", n <= i ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <Button variant="hud" size="sm" onClick={() => setPhase("briefing")}>
          <SkipForward aria-hidden /> Skip intro
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
        <div className="panel mx-auto max-w-3xl p-5 sm:p-6">
          <div className="hud-label text-primary">{panel.kicker}</div>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{panel.title}</h2>
          {panel.speaker && <div className="mt-1 font-mono text-xs text-amber">{SPEAKER_NAMES[panel.speaker]}</div>}
          <p className="mt-3 min-h-[5.5rem] text-base leading-relaxed sm:text-lg" aria-live="polite">
            {shown}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="hud-label hidden sm:inline">Enter / Space to continue</span>
            <Button variant="mission" size="xl" onClick={advance} autoFocus>
              {!done ? "Show all" : last ? "Begin Astronaut Preparation" : "Continue"} <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
