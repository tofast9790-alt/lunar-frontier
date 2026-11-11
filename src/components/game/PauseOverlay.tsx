import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ControlsLegend } from "./ControlsLegend";
import { OverlayFrame } from "./OverlayFrame";

export function PauseOverlay({
  onResume,
  onRestart,
  missionCode,
  legend,
}: {
  onResume: () => void;
  onRestart: () => void;
  missionCode: string;
  legend?: React.ReactNode;
}) {
  const closeOverlay = onResume;
  const [confirmRestart, setConfirmRestart] = useState(false);
  return (
    <OverlayFrame kicker="Paused" title="Mission paused" onClose={closeOverlay} closeLabel="Resume (Esc)">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Button variant="mission" size="xl" data-autofocus onClick={closeOverlay}>
            Resume mission
          </Button>
          {confirmRestart ? (
            <div className="rounded-md border border-amber/50 bg-amber/5 p-3 text-sm">
              <p>Restart {missionCode} from the briefing? Progress in this run will be cleared (saved records are kept).</p>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmRestart(false)}>
                  Cancel
                </Button>
                <Button variant="mission" size="sm" onClick={onRestart}>
                  Yes, restart
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="menu" onClick={() => setConfirmRestart(true)}>
              Restart mission
            </Button>
          )}
          <Button variant="menu" asChild>
            <Link to="/">Quit to main menu</Link>
          </Button>
        </div>
        <div>
          <div className="hud-label mb-2">Controls</div>
          {legend ?? <ControlsLegend />}
        </div>
      </div>
    </OverlayFrame>
  );
}
