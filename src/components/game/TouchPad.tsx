import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { setVirtualDir, type Dir } from "@/game/core/input";

function PadButton({ dir, label, children, className }: { dir: Dir; label: string; children: React.ReactNode; className: string }) {
  const press = (down: boolean) => () => setVirtualDir(dir, down);
  return (
    <button
      type="button"
      aria-label={label}
      className={`panel grid size-11 touch-none select-none place-items-center text-primary active:bg-primary/20 ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setVirtualDir(dir, true);
      }}
      onPointerUp={press(false)}
      onPointerCancel={press(false)}
      onLostPointerCapture={press(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

/** On-screen movement pad for mouse/touch players. */
export function TouchPad() {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1" role="group" aria-label="Movement pad">
      <PadButton dir="up" label="Move up" className="col-start-2">
        <ArrowUp aria-hidden />
      </PadButton>
      <PadButton dir="left" label="Move left" className="col-start-1 row-start-2">
        <ArrowLeft aria-hidden />
      </PadButton>
      <PadButton dir="right" label="Move right" className="col-start-3 row-start-2">
        <ArrowRight aria-hidden />
      </PadButton>
      <PadButton dir="down" label="Move down" className="col-start-2 row-start-3">
        <ArrowDown aria-hidden />
      </PadButton>
    </div>
  );
}
