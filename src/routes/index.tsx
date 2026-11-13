import { createFileRoute, Link } from "@tanstack/react-router";
import outpostImg from "@/assets/intro-outpost.jpg";
import { Button } from "@/components/ui/button";
import { MISSION_ID } from "@/game/missions/mission01/data";
import { MISSION_ID as M02_ID } from "@/game/missions/mission02/data";
import { useSave } from "@/game/persistence/save";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lunar Frontier — Beyond Earth. A New Beginning." },
      {
        name: "description",
        content: "A 2D educational lunar exploration game for ages 13–18. Play Mission 01 to earn launch authorization, then fly Mission 02: a top-down landing at the lunar south pole.",
      },
      { property: "og:title", content: "Lunar Frontier — Beyond Earth. A New Beginning." },
      { property: "og:description", content: "Command humanity's lunar south pole outpost. Missions 01 and 02 are playable now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MainMenu,
});

function MainMenu() {
  const save = useSave();
  const m01 = save.missions[MISSION_ID];
  const m02 = save.missions[M02_ID];
  const m02Unlocked = Boolean(m01?.completed);
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      <img
        src={outpostImg}
        alt="Research outpost on the lunar south polar region with Earth in the sky"
        width={1600}
        height={912}
        className="animate-kenburns absolute inset-0 h-full w-full object-cover"
      />
      <div className="image-fade-left absolute inset-0" />
      <div className="image-fade-bottom absolute inset-0" />

      <div className="relative flex min-h-[100dvh] max-w-xl flex-col justify-center gap-8 px-6 py-10 sm:px-12">
        <div>
          <div className="hud-label text-primary">Chapter 1 — The Arrival · 2042</div>
          <h1 className="mt-3 text-5xl leading-none font-bold tracking-tight sm:text-7xl">
            LUNAR
            <br />
            FRONTIER
          </h1>
          <p className="mt-4 font-display text-lg text-amber sm:text-xl">Beyond Earth. A New Beginning.</p>
        </div>

        <nav className="grid gap-2.5" aria-label="Main menu">
          {m02Unlocked ? (
            <>
              <Button variant="mission" size="xl" className="justify-start" asChild>
                <Link to="/mission-02">{m02?.completed ? "Replay Mission 02 — Touchdown" : "Continue: Mission 02 — Touchdown"}</Link>
              </Button>
              <Button variant="menu" size="xl" asChild>
                <Link to="/play">Replay Mission 01</Link>
              </Button>
            </>
          ) : (
            <Button variant="mission" size="xl" className="justify-start" asChild>
              <Link to="/play">Start Mission</Link>
            </Button>
          )}
          <Button variant="menu" size="xl" asChild>
            <Link to="/academy">Lunar Academy</Link>
          </Button>
          <Button variant="menu" size="xl" asChild>
            <Link to="/records">Mission Records</Link>
          </Button>
          <Button variant="menu" size="xl" asChild>
            <Link to="/settings">Settings</Link>
          </Button>
        </nav>

        <div className="panel divide-y divide-border text-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span>
              <span className="hud-label block">Mission 01 · The Selection</span>
              {m01?.completed ? "Completed" : "Ready to play"}
            </span>
            {m01?.completed && (
              <span className="text-right">
                <span className="hud-label block">Best score</span>
                <span className="font-display text-lg text-amber">{m01.bestScore}</span>
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span>
              <span className="hud-label block">Mission 02 · Touchdown</span>
              {m02?.completed ? "Completed" : m02Unlocked ? "Unlocked" : "Locked — complete Mission 01"}
            </span>
            {m02?.completed && (
              <span className="text-right">
                <span className="hud-label block">Best score</span>
                <span className="font-display text-lg text-amber">{m02.bestScore}</span>
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Playable prototype: Missions 01–02 (Mission 02 unlocks after Mission 01). Strictly 2D. Best on a Windows PC browser with keyboard; mouse and touch controls included.
        </p>
      </div>
    </main>
  );
}
