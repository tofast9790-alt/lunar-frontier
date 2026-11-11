import { useCallback, useEffect, useState } from "react";
import { ChevronRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isEditableTarget } from "@/game/core/input";
import type { Speaker } from "@/game/core/dialogue";
import { cn } from "@/lib/utils";
import { useTypewriter } from "./Typewriter";

export interface StoryPanel {
  kicker: string;
  title: string;
  image?: string;
  imageAlt?: string;
  speaker?: Speaker;
  text: string;
}

/** Full-screen illustrated story panels with typewriter text. Enter/Space/→ advance. */
export function StorySequence({
  panels,
  finalLabel,
  onDone,
  isBlocked,
  names,
  fallback,
}: {
  panels: StoryPanel[];
  finalLabel: string;
  onDone: () => void;
  isBlocked?: () => boolean;
  names: Record<Speaker, string>;
  fallback?: React.ReactNode;
}) {
  const [i, setI] = useState(0);
  const panel = panels[i] ?? panels[0]!;
  const last = i === panels.length - 1;
  const { shown, done, finish } = useTypewriter(panel.text, 22);

  const advance = useCallback(() => {
    if (!done) return finish();
    if (last) onDone();
    else setI((n) => n + 1);
  }, [done, finish, last, onDone]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target) || e.target instanceof HTMLButtonElement) return;
      if (isBlocked?.()) return;
      if (e.code === "Enter" || e.code === "Space" || e.code === "ArrowRight") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, isBlocked]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div key={i} className="absolute inset-0 animate-fade-up">
        {panel.image ? (
          <img src={panel.image} alt={panel.imageAlt ?? ""} className="animate-kenburns h-full w-full object-cover" width={1600} height={912} />
        ) : (
          <div className="starfield animate-drift grid h-full w-full place-items-center">{fallback}</div>
        )}
        <div className="image-fade-bottom absolute inset-0" />
      </div>

      <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
        <div className="flex gap-1.5" aria-label={`Panel ${i + 1} of ${panels.length}`}>
          {panels.map((_, n) => (
            <span key={n} className={cn("h-1 w-8 rounded-full", n <= i ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <Button variant="hud" size="sm" onClick={onDone}>
          <SkipForward aria-hidden /> Skip intro
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
        <div className="panel mx-auto max-w-3xl p-5 sm:p-6">
          <div className="hud-label text-primary">{panel.kicker}</div>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">{panel.title}</h2>
          {panel.speaker && <div className="mt-1 font-mono text-xs text-amber">{names[panel.speaker]}</div>}
          <p className="mt-3 min-h-[5.5rem] text-base leading-relaxed sm:text-lg" aria-live="polite">
            {shown}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="hud-label hidden sm:inline">Enter / Space to continue</span>
            <Button variant="mission" size="xl" onClick={advance} autoFocus>
              {!done ? "Show all" : last ? finalLabel : "Continue"} <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
