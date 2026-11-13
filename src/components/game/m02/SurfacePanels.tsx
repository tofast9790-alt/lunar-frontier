import { useState } from "react";
import { CheckCircle2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SURFACE_POINTS } from "@/game/missions/mission02/data";
import { collectSample, reportToControl, sayAgain, tryDeployBeacon, useM02 } from "@/game/missions/mission02/state";
import type { Heading, PanelTilt, SurfaceId } from "@/game/missions/mission02/types";
import { cn } from "@/lib/utils";
import { OverlayFrame } from "../OverlayFrame";
import { Portrait } from "../Portrait";
import { Step } from "../stations/parts";
import { M02Note } from "./CockpitChecks";

function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
  disabled,
  label,
}: {
  options: [T, string][];
  value: T | null;
  onChange: (v: T) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map(([id, text]) => (
        <Button
          key={id}
          variant="choice"
          size="sm"
          role="radio"
          aria-checked={value === id}
          disabled={disabled}
          className={cn(value === id && "border-primary bg-primary/15")}
          onClick={() => onChange(id)}
        >
          {text}
        </Button>
      ))}
    </div>
  );
}

const TILTS: [PanelTilt, string][] = [
  ["flat", "Flat (facing up)"],
  ["angled", "Angled 45°"],
  ["vertical", "Upright (vertical)"],
];
const HEADINGS: [Heading, string][] = [
  ["north", "North"],
  ["east", "East"],
  ["south", "South"],
  ["west", "West"],
];

function Done({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-success/50 bg-success/10 p-3">
      <span className="flex items-center gap-2 text-sm text-success">
        <CheckCircle2 className="size-4" aria-hidden /> {text}
      </span>
      <Button variant="hud" onClick={onClose} data-autofocus>
        Back to the surface
      </Button>
    </div>
  );
}

export function BeaconPanel({ onClose }: { onClose: () => void }) {
  const s = useM02();
  const deployed = s.beacon.deployed;
  const [mast, setMast] = useState(deployed);
  const [tilt, setTilt] = useState<PanelTilt | null>(deployed ? "vertical" : null);
  const [heading, setHeading] = useState<Heading | null>(deployed ? "west" : null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const deploy = () => {
    if (!tilt || !heading) return;
    if (tryDeployBeacon(tilt, heading)) {
      setFeedback(null);
      return;
    }
    const hint =
      tilt !== "vertical"
        ? "Power too low. The Sun is only a few degrees above the horizon here, so a panel facing up catches almost no light."
        : "Panel is in its own shade. Look at the long shadows on the ground — the Sun is on the opposite side.";
    setFeedback(hint);
    sayAgain({ speaker: "ares", text: `Beacon power check failed. ${hint}` });
  };

  return (
    <OverlayFrame kicker={SURFACE_POINTS.beacon.label} title="Deploy the navigation beacon" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The beacon runs on solar power and must stay charged for future landers to home in on it.
        </p>
        <ol className="space-y-2">
          <Step n={1} title="Plant the mast in the regolith" done={mast} active={!mast}>
            {mast ? (
              <p className="text-xs text-success">Mast planted and steady.</p>
            ) : (
              <Button variant="mission" size="sm" onClick={() => setMast(true)} data-autofocus>
                Drive mast into the ground
              </Button>
            )}
          </Step>
          <Step n={2} title="Set the solar panel tilt" done={deployed} active={mast && !deployed}>
            <ChoiceRow label="Panel tilt" options={TILTS} value={tilt} onChange={setTilt} disabled={deployed} />
          </Step>
          <Step n={3} title="Turn the panel to face the Sun" done={deployed} active={mast && !deployed}>
            <p className="mb-2 text-xs text-muted-foreground">
              Look around you on the surface: every rock's shadow stretches toward the <span className="text-foreground">east</span>.
            </p>
            <ChoiceRow label="Panel faces" options={HEADINGS} value={heading} onChange={setHeading} disabled={deployed} />
          </Step>
        </ol>
        {feedback && !deployed && (
          <div className="flex gap-3 rounded-md border border-amber/50 bg-amber/5 p-3" role="alert">
            <Portrait speaker="ares" className="h-10 w-10" />
            <p className="text-sm">{feedback}</p>
          </div>
        )}
        <M02Note id="beacon" />
        {deployed ? (
          <Done text="Beacon deployed and transmitting" onClose={onClose} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {s.beacon.mistakes > 0 ? `Failed power checks: ${s.beacon.mistakes}` : "First-try deployment earns a bonus."}
            </span>
            <Button variant="mission" disabled={!mast || !tilt || !heading} onClick={deploy}>
              <Radio aria-hidden /> Switch on beacon
            </Button>
          </div>
        )}
      </div>
    </OverlayFrame>
  );
}

export function SamplePanel({ onClose }: { onClose: () => void }) {
  const s = useM02();
  const [spot, setSpot] = useState<"rim" | "floor" | null>(s.sampleCollected ? "rim" : null);
  return (
    <OverlayFrame kicker={SURFACE_POINTS.sample.label} title="Collect a regolith sample (optional)" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Below you, the crater floor has not seen sunlight for a very long time. Scientists want to know whether ice has drifted up to the rim.
        </p>
        <ol className="space-y-2">
          <Step n={1} title="Choose where to scoop" done={spot === "rim"} active={spot !== "rim"}>
            <ChoiceRow
              label="Sample location"
              options={[
                ["rim", "Sunlit rim edge, at my feet"],
                ["floor", "Climb down to the dark floor"],
              ]}
              value={spot}
              onChange={setSpot}
              disabled={s.sampleCollected}
            />
            {spot === "floor" && (
              <p className="mt-2 text-xs text-amber" role="alert">
                ARES: Negative. The floor is far below −200 °C, steep and unlit — your suit isn't rated for it. Sample from the rim.
              </p>
            )}
          </Step>
          <Step n={2} title="Scoop and seal the sample bag" done={s.sampleCollected} active={spot === "rim" && !s.sampleCollected}>
            <Button variant="mission" size="sm" onClick={collectSample}>
              Scoop and seal
            </Button>
          </Step>
        </ol>
        <M02Note id="ice" />
        {s.sampleCollected && <Done text="Sample sealed and stowed" onClose={onClose} />}
      </div>
    </OverlayFrame>
  );
}

export function LanderPanel({ onClose }: { onClose: () => void }) {
  const s = useM02();
  const ready = s.beacon.deployed;
  return (
    <OverlayFrame kicker={SURFACE_POINTS.lander.label} title="Report to Mission Control" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3 rounded-md bg-panel-strong p-3">
          <Portrait speaker="elena" className="h-12 w-12" />
          <p className="text-sm">
            {ready
              ? "We're receiving the beacon, Commander. Send your surface report when you're ready — or take a moment first if you want that rim sample."
              : "Not yet, Commander. The beacon isn't transmitting. It goes on the marked site east of the lander."}
          </p>
        </div>
        <ul className="space-y-1.5 text-sm">
          <li className="text-success">✓ Landed safely{s.descent.failures > 0 ? ` (after ${s.descent.failures} abort${s.descent.failures === 1 ? "" : "s"})` : ""}</li>
          <li className={ready ? "text-success" : "text-amber"}>{ready ? "✓" : "·"} Navigation beacon {ready ? "transmitting" : "not deployed"}</li>
          <li className={s.sampleCollected ? "text-success" : "text-muted-foreground"}>
            {s.sampleCollected ? "✓" : "·"} Regolith sample (optional) {s.sampleCollected ? "stowed" : "not collected"}
          </li>
        </ul>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="hud" onClick={onClose} data-autofocus={!ready || undefined}>
            Back to the surface
          </Button>
          <Button variant="mission" disabled={!ready} onClick={reportToControl} data-autofocus={ready || undefined}>
            Send surface report
          </Button>
        </div>
      </div>
    </OverlayFrame>
  );
}

export function SurfacePanel({ id, onClose }: { id: SurfaceId; onClose: () => void }) {
  if (id === "beacon") return <BeaconPanel onClose={onClose} />;
  if (id === "sample") return <SamplePanel onClose={onClose} />;
  return <LanderPanel onClose={onClose} />;
}
