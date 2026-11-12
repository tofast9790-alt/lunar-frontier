import { useEffect, useRef } from "react";
import type PhaserType from "phaser";
import { attachMovementKeys, attachThrustKey } from "@/game/core/input";

export type SceneKey = "training" | "descent" | "surface";

const LABELS: Record<SceneKey, string> = {
  training: "Prep Bay training room. Move with WASD or arrow keys, interact with E.",
  descent: "Top-down lunar descent. Hold Space for the main engine, WASD or arrow keys for side thrusters.",
  surface: "Lunar surface beside the lander. Move with WASD or arrow keys, interact with E.",
};

async function loadScene(key: SceneKey): Promise<typeof PhaserType.Scene> {
  if (key === "descent") return (await import("./DescentScene")).DescentScene;
  if (key === "surface") return (await import("./SurfaceScene")).SurfaceScene;
  return (await import("./TrainingScene")).TrainingScene;
}

/**
 * Mounts one Phaser game into a div. Phaser is imported lazily (browser only) and
 * destroyed on unmount, so React re-renders/StrictMode never create duplicate canvases.
 */
export function PhaserGame({ scene = "training" }: { scene?: SceneKey }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: PhaserType.Game | null = null;
    let cancelled = false;
    const detachKeys = attachMovementKeys();
    const detachThrust = scene === "descent" ? attachThrustKey() : () => {};

    (async () => {
      const [Phaser, SceneClass] = await Promise.all([import("phaser"), loadScene(scene)]);
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
        scene: [SceneClass],
      });
    })();

    return () => {
      cancelled = true;
      detachKeys();
      detachThrust();
      game?.destroy(true);
      game = null;
    };
  }, [scene]);

  return <div ref={hostRef} className="absolute inset-0" role="application" aria-label={LABELS[scene]} />;
}
