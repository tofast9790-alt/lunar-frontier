import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Modal frame for stations, quiz and menus. Focuses itself so Enter/Space hit its buttons. */
export function OverlayFrame({
  kicker,
  title,
  onClose,
  children,
  wide,
  closeLabel = "Close (Esc)",
}: {
  kicker: string;
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  wide?: boolean;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el;
    first?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="scrim absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "panel animate-fade-up flex max-h-full w-full flex-col overflow-hidden outline-none",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="hud-label text-primary">{kicker}</div>
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
              <X aria-hidden /> <span className="hidden sm:inline">Esc</span>
            </Button>
          )}
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
