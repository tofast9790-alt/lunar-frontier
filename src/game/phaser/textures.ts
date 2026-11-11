import type Phaser from "phaser";
import { C } from "./palette";

/** Shared top-down sprites, generated once per game. */
export function makeCommonTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("astronaut")) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Astronaut, top-down, facing up (helmet visor toward -y).
  g.fillStyle(C.steel, 1).fillRoundedRect(13, 25, 22, 17, 4); // life-support backpack
  g.fillStyle(C.moonDark, 1).fillRect(16, 29, 16, 2).fillRect(16, 34, 16, 2);
  g.fillStyle(C.white, 1).fillEllipse(24, 26, 38, 24); // shoulders / torso
  g.lineStyle(2, C.moonDark, 1).strokeEllipse(24, 26, 38, 24);
  g.fillStyle(C.white, 1).fillCircle(6, 24, 6).fillCircle(42, 24, 6); // arms
  g.lineStyle(1.5, C.moonDark, 1).strokeCircle(6, 24, 6).strokeCircle(42, 24, 6);
  g.fillStyle(C.cyan, 1).fillCircle(9, 21, 2); // mission patch
  g.fillStyle(C.white, 1).fillCircle(24, 19, 11); // helmet
  g.lineStyle(2, C.moonDark, 1).strokeCircle(24, 19, 11);
  g.fillStyle(C.amber, 1).fillEllipse(24, 13, 16, 8); // gold visor
  g.fillStyle(C.white, 0.7).fillEllipse(20, 12, 4, 2);
  g.generateTexture("astronaut", 48, 48);
  g.clear();

  g.fillStyle(0xffffff, 1).fillCircle(4, 4, 4);
  g.generateTexture("dot", 8, 8);
  g.destroy();
}

/** Lander seen from directly above: gold descent stage, four legs, white crew cabin. 128×128. */
export function makeLanderTexture(scene: Phaser.Scene) {
  if (scene.textures.exists("lander")) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const c = 64;
  // Legs + footpads (diagonals)
  g.lineStyle(5, C.amberDeep, 1);
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    g.lineBetween(c + dx * 22, c + dy * 22, c + dx * 50, c + dy * 50);
  }
  g.fillStyle(C.moon, 1);
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) g.fillCircle(c + dx * 52, c + dy * 52, 9);
  g.lineStyle(2, C.moonDark, 1);
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) g.strokeCircle(c + dx * 52, c + dy * 52, 9);
  // Descent stage octagon (gold foil)
  const oct: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    oct.push({ x: c + Math.cos(a) * 36, y: c + Math.sin(a) * 36 });
  }
  g.fillStyle(C.amber, 1).fillPoints(oct, true);
  g.lineStyle(2, C.amberDeep, 1).strokePoints(oct, true);
  g.lineStyle(1, C.amberDeep, 0.7);
  g.lineBetween(c - 30, c - 8, c + 30, c - 14).lineBetween(c - 26, c + 16, c + 28, c + 10);
  // RCS quads
  g.fillStyle(C.steel, 1);
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) g.fillRect(c + dx * 30 - 4, c + dy * 30 - 4, 8, 8);
  // Crew cabin
  g.fillStyle(C.white, 1).fillRoundedRect(c - 20, c - 18, 40, 36, 8);
  g.lineStyle(2, C.moonDark, 1).strokeRoundedRect(c - 20, c - 18, 40, 36, 8);
  g.fillStyle(C.steel, 1).fillCircle(c, c + 2, 7); // docking hatch
  g.fillStyle(C.cyan, 1).fillCircle(c + 12, c - 10, 4); // antenna
  g.fillStyle(C.screen, 1).fillTriangle(c - 14, c - 16, c - 4, c - 16, c - 9, c - 8); // window
  g.generateTexture("lander", 128, 128);
  g.destroy();
}
