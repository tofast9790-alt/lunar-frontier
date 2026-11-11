import { useEffect, useRef } from "react";
import type PhaserType from "phaser";
import { attachMovementKeys } from "@/game/core/input";

/**
 * Mounts one Phaser game into a div. Phaser is imported lazily (browser only) and
 * destroyed on unmount, so React re-renders/StrictMode never create duplicate canvases.
 */
export function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: PhaserType.Game | null = null;
    let cancelled = false;
    const detachKeys = attachMovementKeys();

    (async () => {
      const [{ default: Phaser }, { TrainingScene }] = await Promise.all([
        import("phaser"),
        import("./TrainingScene"),
      ]);
      try {
        await Promise.race([
          document.fonts.load('500 12px "IBM Plex Mono"'),
          new Promise((r) => setTimeout(r, 1200)),
        ]);
      } catch {
        // Font loading is best-effort; fall back to system mono.
      }
      const host = hostRef.current;
      if (cancelled || !host) return;
      host.innerHTML = "";
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        backgroundColor: "#0b1322",
        banner: false,
        scale: { mode: Phaser.Scale.RESIZE, width: host.clientWidth, height: host.clientHeight },
        physics: { default: "arcade", arcade: { debug: false } },
        input: { keyboard: false },
        render: { antialias: true, roundPixels: false },
        scene: [TrainingScene],
      });
    })();

    return () => {
      cancelled = true;
      detachKeys();
      game?.destroy(true);
      game = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0"
      role="application"
      aria-label="Prep Bay training room. Move with WASD or arrow keys, interact with E."
    />
  );
}
