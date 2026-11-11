import elenaImg from "@/assets/intro-elena.jpg";
import aresImg from "@/assets/intro-ares.jpg";
import type { Speaker } from "@/game/missions/mission01/types";
import { cn } from "@/lib/utils";

const SRC: Record<Speaker, { src: string; pos: string } | null> = {
  elena: { src: elenaImg, pos: "object-[28%_22%]" },
  ares: { src: aresImg, pos: "object-[60%_30%]" },
  system: null,
};

export function Portrait({ speaker, className }: { speaker: Speaker; className?: string }) {
  const p = SRC[speaker];
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border",
        speaker === "ares" ? "border-primary/60" : speaker === "elena" ? "border-amber/60" : "border-border",
        className ?? "h-14 w-14",
      )}
    >
      {p ? (
        <img src={p.src} alt="" className={cn("h-full w-full scale-[2.2] object-cover", p.pos)} />
      ) : (
        <div className="grid h-full w-full place-items-center bg-muted font-mono text-xs text-muted-foreground">SYS</div>
      )}
      <div className="scanlines pointer-events-none absolute inset-0" />
    </div>
  );
}
