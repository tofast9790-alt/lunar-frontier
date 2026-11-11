import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { ControlsLegend } from "@/components/game/ControlsLegend";

export const Route = createFileRoute("/academy")({
  head: () => ({
    meta: [
      { title: "Lunar Academy — Lunar Frontier" },
      { name: "description", content: "Short, age-appropriate lessons on spacesuit pressure, oxygen vs CO₂ removal, radio delay and emergency checklists." },
      { property: "og:title", content: "Lunar Academy — Lunar Frontier" },
      { property: "og:description", content: "The real science behind Mission 01's equipment checks." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Academy,
});

const LESSONS = [
  {
    title: "Suit pressure",
    tag: "Spacesuits",
    body: [
      "Space and the Moon's surface have almost no air pressure. A spacesuit holds a layer of pressurised oxygen around your body so your lungs can work and your body fluids don't start to boil.",
      "A suit is really a tiny personal spacecraft: pressure, oxygen, cooling or heating, and protection from dust, sunlight and micrometeoroids.",
    ],
    sim: "Many spacewalk suits operate around 29.6 kPa (4.3 psi) of nearly pure oxygen — roughly 30% of sea-level pressure — so the suit stays flexible.",
  },
  {
    title: "Oxygen supply vs CO₂ removal",
    tag: "Life support",
    body: [
      "You breathe in oxygen and breathe out carbon dioxide. In a sealed suit, CO₂ builds up and becomes dangerous — even when there's plenty of oxygen left.",
      "So life support has two separate jobs: tanks supply oxygen, and a scrubber (a chemical or regenerable filter) removes CO₂. Suits also carry a backup oxygen supply for emergencies.",
    ],
  },
  {
    title: "Radio communication delay",
    tag: "Communications",
    body: [
      "Radio waves travel at the speed of light, about 300,000 km per second. The Moon is about 384,400 km away on average, so each message takes roughly 1.3 seconds one way — about 2.6 seconds for a reply.",
      "The farther a spacecraft travels, the longer the delay. Deep-space crews must be able to make decisions without waiting for Earth.",
    ],
    sim: "In-game delays use the average Earth–Moon distance; real delays also vary slightly with the Moon's orbit and ground-station processing.",
  },
  {
    title: "Emergency checklists",
    tag: "Safety",
    body: [
      "Under stress, people forget steps or do them in the wrong order. Space crews train with written procedures and checklists so the right actions happen reliably.",
      "Preparing emergency supplies ahead of time and practising the procedure turns a scary moment into a familiar routine.",
    ],
    sim: "The emergency procedure card in Mission 01 is a simplified training example created for this game, not an official agency procedure.",
  },
];

function Academy() {
  return (
    <PageShell kicker="Learn the science" title="Lunar Academy">
      <div className="grid gap-4 md:grid-cols-2">
        {LESSONS.map((l) => (
          <article key={l.title} className="panel space-y-3 p-5">
            <div className="hud-label text-amber">{l.tag}</div>
            <h2 className="text-xl font-semibold">{l.title}</h2>
            {l.body.map((p) => (
              <p key={p} className="text-sm leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
            {l.sim && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="sim-tag mr-2">simplified</span>
                {l.sim}
              </p>
            )}
          </article>
        ))}
      </div>
      <section className="panel mt-6 grid gap-6 p-5 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold">How to play Mission 01</h2>
          <ol className="list-inside list-decimal space-y-1.5 text-sm text-foreground/90">
            <li>Press Start Mission and watch the intro (or skip it).</li>
            <li>Read the briefing, then enter the Prep Bay.</li>
            <li>Walk to each glowing station and press E to inspect it. Complete every step.</li>
            <li>When all four checks are done, use the Certification Terminal by the airlock.</li>
            <li>Pass the quiz (2 of 3), review your evaluation and launch.</li>
          </ol>
        </div>
        <div>
          <h2 className="mb-3 text-xl font-semibold">Controls</h2>
          <ControlsLegend />
        </div>
      </section>
    </PageShell>
  );
}
