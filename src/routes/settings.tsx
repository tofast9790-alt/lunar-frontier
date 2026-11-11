import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { resetSave, updateSettings, useSave } from "@/game/persistence/save";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Lunar Frontier" },
      { name: "description", content: "Adjust motion, text speed and touch controls, or reset your Lunar Frontier save." },
      { property: "og:title", content: "Settings — Lunar Frontier" },
      { property: "og:description", content: "Accessibility and save options for Lunar Frontier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function Row({ id, title, desc, children }: { id: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4 last:border-0">
      <div>
        <label htmlFor={id} className="font-semibold">
          {title}
        </label>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { settings, missions } = useSave();
  const [confirm, setConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const hasProgress = Object.keys(missions).length > 0;

  return (
    <PageShell kicker="Options" title="Settings">
      <section className="panel px-5">
        <Row id="reduce-motion" title="Reduce motion" desc="Turns off camera shake, particles, pans and bobbing animations.">
          <Switch id="reduce-motion" checked={settings.reducedMotion} onCheckedChange={(v) => updateSettings({ reducedMotion: v })} />
        </Row>
        <Row id="text-speed" title="Dialogue text" desc="Show dialogue gradually or all at once.">
          <div id="text-speed" role="radiogroup" className="flex gap-2">
            {(["normal", "instant"] as const).map((v) => (
              <Button
                key={v}
                role="radio"
                aria-checked={settings.textSpeed === v}
                variant="hud"
                size="sm"
                className={cn(settings.textSpeed === v && "border-primary bg-primary/15")}
                onClick={() => updateSettings({ textSpeed: v })}
              >
                {v === "normal" ? "Typewriter" : "Instant"}
              </Button>
            ))}
          </div>
        </Row>
        <Row id="touch-pad" title="On-screen movement pad" desc="Show arrow buttons for mouse or touch movement in the Prep Bay.">
          <Switch id="touch-pad" checked={settings.showTouchPad} onCheckedChange={(v) => updateSettings({ showTouchPad: v })} />
        </Row>
      </section>

      <section className="panel mt-6 space-y-3 p-5">
        <h2 className="text-xl font-semibold">Save data</h2>
        <p className="text-sm text-muted-foreground">
          Progress and best scores are stored in this browser only. {hasProgress ? "You have saved mission progress." : "No mission progress saved yet."}
        </p>
        {confirm ? (
          <div className="rounded-md border border-destructive/60 bg-destructive/10 p-3 text-sm">
            <p>Erase all mission records, best scores and settings? This can't be undone.</p>
            <div className="mt-2 flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  resetSave();
                  setConfirm(false);
                  setResetDone(true);
                }}
              >
                Yes, reset save
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="destructive" onClick={() => { setConfirm(true); setResetDone(false); }}>
            Reset save data
          </Button>
        )}
        {resetDone && <p className="text-sm text-success" role="status">Save data cleared.</p>}
      </section>
    </PageShell>
  );
}
