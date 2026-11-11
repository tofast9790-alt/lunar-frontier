import { useState } from "react";
import { BookOpen, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCIENCE_NOTES } from "@/game/missions/mission01/data";
import { markNoteRead, useMission } from "@/game/missions/mission01/state";
import type { StationId } from "@/game/missions/mission01/types";
import { cn } from "@/lib/utils";

export function Step({
  n,
  title,
  done,
  active,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  active: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "rounded-md border p-3 transition-colors",
        done ? "border-success/50 bg-success/5" : active ? "border-amber/60 bg-amber/5" : "border-border opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full font-mono text-xs",
            done ? "bg-success text-success-foreground" : active ? "bg-amber text-amber-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {done ? "✓" : n}
        </span>
        <h3 className="font-sans text-sm font-semibold">{title}</h3>
      </div>
      {(active || done) && children && <div className="mt-2 pl-8 text-sm">{children}</div>}
    </li>
  );
}

export function Gauge({
  label,
  value,
  max,
  unit,
  tone = "cyan",
  sim = true,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  tone?: "cyan" | "amber" | "success";
  sim?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-mono text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2 font-mono">
          {value.toFixed(1)} {unit}
          {sim && <span className="sim-tag">sim</span>}
        </span>
      </div>
      <div className="gauge-track mt-1 h-2 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-150",
            tone === "amber" ? "bg-amber" : tone === "success" ? "bg-success" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ScienceNote({ id }: { id: StationId }) {
  const { notesRead } = useMission();
  const [open, setOpen] = useState(false);
  const note = SCIENCE_NOTES[id];
  return (
    <div className="rounded-md border border-primary/30 bg-primary/5">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          markNoteRead(id);
        }}
      >
        <span className="flex items-center gap-2 text-primary">
          <BookOpen className="size-4" aria-hidden /> Science note: {note.title}
        </span>
        <span className="flex items-center gap-2">
          {notesRead[id] && <span className="font-mono text-[10px] uppercase text-success">read</span>}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
        </span>
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3 text-sm leading-relaxed text-foreground/90">
          <p>{note.body}</p>
          {note.simplified && (
            <p className="text-muted-foreground">
              <span className="sim-tag mr-2">simplified</span>
              {note.simplified}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ConfirmBar({
  ready,
  done,
  label,
  onConfirm,
  onClose,
}: {
  ready: boolean;
  done: boolean;
  label: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (done) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/50 bg-success/10 p-3">
        <span className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="size-4" aria-hidden /> Check verified and logged
        </span>
        <Button variant="hud" onClick={onClose} data-autofocus>
          Return to Prep Bay
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">
        {ready ? "All steps complete." : "Complete every step to confirm this check."}
      </span>
      <Button variant="mission" disabled={!ready} onClick={onConfirm}>
        {label}
      </Button>
    </div>
  );
}
