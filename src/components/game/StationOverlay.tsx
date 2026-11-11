import { INTERACTABLES, STATION_TITLES } from "@/game/missions/mission01/data";
import type { InteractableId, StationId } from "@/game/missions/mission01/types";
import { OverlayFrame } from "./OverlayFrame";
import { BoardPanel } from "./stations/BoardPanel";
import { CommsCheck } from "./stations/CommsCheck";
import { EmergencyCheck } from "./stations/EmergencyCheck";
import { OxygenCheck } from "./stations/OxygenCheck";
import { SuitCheck } from "./stations/SuitCheck";
import { TerminalPanel } from "./stations/TerminalPanel";

const STATION_COMPONENTS: Record<StationId, React.ComponentType<{ onClose: () => void }>> = {
  suit: SuitCheck,
  oxygen: OxygenCheck,
  comms: CommsCheck,
  emergency: EmergencyCheck,
};

export function StationOverlay({ id, onClose }: { id: InteractableId; onClose: () => void }) {
  if (id === "board") {
    return (
      <OverlayFrame kicker="North wall" title="Mission Checklist Board" onClose={onClose}>
        <BoardPanel onClose={onClose} />
      </OverlayFrame>
    );
  }
  if (id === "terminal") {
    return (
      <OverlayFrame kicker="Launch readiness" title="Certification Terminal" onClose={onClose}>
        <TerminalPanel onClose={onClose} />
      </OverlayFrame>
    );
  }
  if (id === "ares") return null;
  const Comp = STATION_COMPONENTS[id];
  return (
    <OverlayFrame kicker={INTERACTABLES[id].label} title={STATION_TITLES[id]} onClose={onClose} wide>
      <Comp onClose={onClose} />
    </OverlayFrame>
  );
}
