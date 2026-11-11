const KEYS: [string, string][] = [
  ["W A S D / Arrows", "Move"],
  ["E", "Interact with highlighted station"],
  ["H", "ARES hints & diagnostics"],
  ["Esc", "Pause / close panel"],
  ["1–4", "Answer quiz questions"],
];

export function ControlsLegend({ keys = KEYS }: { keys?: [string, string][] }) {
  return (
    <dl className="grid gap-1.5 text-sm">
      {keys.map(([k, v]) => (
        <div key={k} className="flex items-center gap-3">
          <dt className="min-w-36">
            <kbd className="rounded border border-border bg-panel-strong px-1.5 py-0.5 font-mono text-xs">{k}</kbd>
          </dt>
          <dd className="text-muted-foreground">{v}</dd>
        </div>
      ))}
      <p className="mt-1 text-xs text-muted-foreground">Mouse / touch: use the on-screen pad and tap the interaction prompt.</p>
    </dl>
  );
}
