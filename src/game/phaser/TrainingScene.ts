import * as Phaser from "phaser";
import { getMoveVector } from "@/game/core/input";
import { saveStore } from "@/game/persistence/save";
import { INTERACTABLES } from "@/game/missions/mission01/data";
import { missionStore, openOverlay, setNearby } from "@/game/missions/mission01/state";
import { allChecksDone } from "@/game/missions/mission01/scoring";
import type { InteractableId, StationId } from "@/game/missions/mission01/types";
import { STATION_IDS } from "@/game/missions/mission01/types";
import { C, CSS } from "./palette";
import { makeCommonTextures } from "./textures";

export const WORLD_W = 1280;
export const WORLD_H = 800;
const FLOOR = { x: 32, y: 112, w: 1216, h: 656 };
const SPEED = 190;
const INTERACT_RANGE = 78;
const FONT = '"IBM Plex Mono", ui-monospace, monospace';

interface Marker {
  id: InteractableId;
  ring: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  light?: Phaser.GameObjects.Arc | undefined;
  badge?: Phaser.GameObjects.Container;
}

export class TrainingScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private ares!: Phaser.GameObjects.Container;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private markers = new Map<InteractableId, Marker>();
  private doorGfx!: Phaser.GameObjects.Graphics;
  private doorLight!: Phaser.GameObjects.Arc;
  private terminalText!: Phaser.GameObjects.Text;
  private facing = -Math.PI / 2;
  private unsub: (() => void) | null = null;
  private lastSignature = "";

  constructor() {
    super("Training");
  }

  create() {
    this.makeTextures();
    this.cameras.main.setBackgroundColor(C.bg);
    this.physics.world.setBounds(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
    this.obstacles = this.physics.add.staticGroup();

    this.drawFloor();
    this.drawWalls();
    this.drawDoors();
    this.drawDecor();
    this.drawSuitStation();
    this.drawOxygenRack();
    this.drawCommsConsole();
    this.drawEmergencyLocker();
    this.drawBoard();
    this.drawTerminal();
    this.drawTable();
    this.createAres();
    this.createMarkers();
    this.createPlayer();
    if (!saveStore.get().settings.reducedMotion) this.createDust();

    this.physics.add.collider(this.player, this.obstacles);

    this.fitCamera(this.scale.width, this.scale.height);
    this.scale.on("resize", this.onResize, this);

    this.unsub = missionStore.subscribe(() => this.syncFromState());
    this.syncFromState(true);

    // Dev-only handle for automated play-testing (stripped from production builds).
    if (import.meta.env.DEV) (window as unknown as { __lfScene?: TrainingScene }).__lfScene = this;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  private cleanup() {
    this.unsub?.();
    this.unsub = null;
    this.scale.off("resize", this.onResize, this);
    setNearby(null);
  }

  private onResize(size: Phaser.Structs.Size) {
    this.fitCamera(size.width, size.height);
  }

  private fitCamera(w: number, h: number) {
    const cam = this.cameras.main;
    // Leave room above/below the walls for the HUD bar and comms panel.
    const padTop = 56;
    const padBottom = 72;
    const fit = Math.min(w / WORLD_W, h / (WORLD_H + padTop + padBottom));
    const zoom = Phaser.Math.Clamp(fit, 0.72, 1.35);
    cam.setZoom(zoom);
    // When the room is smaller than the view, widen the bounds symmetrically so it stays centred.
    const viewW = w / zoom;
    const viewH = h / zoom;
    const bw = Math.max(WORLD_W, viewW);
    const bh = Math.max(WORLD_H + padTop + padBottom, viewH);
    cam.setBounds((WORLD_W - bw) / 2, -padTop - (bh - (WORLD_H + padTop + padBottom)) / 2, bw, bh);
    if (this.player) cam.startFollow(this.player, true, 0.12, 0.12);
  }

  // ---------------------------------------------------------------- textures
  private makeTextures() {
    makeCommonTextures(this);
  }

  // ------------------------------------------------------------------ room
  private drawFloor() {
    const g = this.add.graphics();
    const T = 40;
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += T) {
      for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += T) {
        const alt = ((x - FLOOR.x) / T + (y - FLOOR.y) / T) % 2 === 0;
        g.fillStyle(alt ? C.floorA : C.floorB, 1).fillRect(x, y, T, T);
        g.lineStyle(1, C.seam, 0.9).strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
        g.fillStyle(C.seam, 1).fillCircle(x + 4, y + 4, 1);
      }
    }
    // Central emblem
    g.lineStyle(2, C.cyanDeep, 0.35).strokeCircle(640, 435, 150);
    g.lineStyle(1, C.cyanDeep, 0.25).strokeCircle(640, 435, 170);
    // Guide lines from entry door to each zone (dashed)
    const dashed = (x1: number, y1: number, x2: number, y2: number, color: number) => {
      const len = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const steps = Math.floor(len / 18);
      g.lineStyle(3, color, 0.35);
      for (let i = 0; i < steps; i += 2) {
        const a = i / steps;
        const b = Math.min(1, (i + 1) / steps);
        g.lineBetween(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
      }
    };
    dashed(60, 420, 470, 420, C.cyan);
    dashed(810, 420, 1240, 420, C.amber);
    dashed(210, 300, 210, 560, C.cyan);
    dashed(1070, 300, 1070, 590, C.cyan);
    // Hazard stripes before airlock
    for (let i = 0; i < 8; i++) {
      g.fillStyle(i % 2 ? C.charcoal : C.amberDeep, 0.8).fillRect(1222, 380 + i * 15, 24, 15);
    }
  }

  private drawWalls() {
    const g = this.add.graphics();
    g.fillStyle(C.wall, 1).fillRect(0, 0, WORLD_W, FLOOR.y);
    g.fillStyle(C.wallFace, 1).fillRect(FLOOR.x, 64, FLOOR.w, FLOOR.y - 64);
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += 80) {
      g.lineStyle(1, C.wallTrim, 1).lineBetween(x, 64, x, FLOOR.y);
    }
    g.fillStyle(C.wallTrim, 1).fillRect(FLOOR.x, FLOOR.y - 6, FLOOR.w, 6);
    g.fillStyle(C.wall, 1)
      .fillRect(0, 0, FLOOR.x, WORLD_H)
      .fillRect(FLOOR.x + FLOOR.w, 0, WORLD_W - FLOOR.x - FLOOR.w, WORLD_H)
      .fillRect(0, FLOOR.y + FLOOR.h, WORLD_W, WORLD_H);
    g.lineStyle(2, C.wallTrim, 1).strokeRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
    // Ceiling light strips glow on wall face
    for (const x of [200, 640, 1080]) {
      const strip = this.add.rectangle(x, 72, 120, 4, C.cyan, 0.8);
      this.add.rectangle(x, 80, 160, 18, C.cyan, 0.06);
      this.tweenGlow(strip, 0.55, 0.9, 2600);
    }
    this.add
      .text(FLOOR.x + 16, 22, "LF-PREP BAY 2 · ASTRONAUT READINESS", { fontFamily: FONT, fontSize: "13px", color: CSS.dim, resolution: 2 })
      .setLetterSpacing?.(2);
  }

  private drawDoors() {
    // Entry door (west)
    const g = this.add.graphics();
    g.fillStyle(C.steel, 1).fillRect(8, 380, 24, 80);
    g.fillStyle(C.charcoal, 1).fillRect(12, 384, 16, 72);
    g.lineStyle(1, C.wallTrim, 1).lineBetween(20, 384, 20, 456);
    this.add.circle(20, 372, 4, C.cyan).setAlpha(0.9);
    this.label(56, 470, "ENTRY", CSS.dim, 11).setOrigin(0, 0.5);

    // Airlock (east) — redrawn when lock state changes
    this.doorGfx = this.add.graphics();
    this.doorLight = this.add.circle(1262, 368, 5, C.amber);
    this.tweenGlow(this.doorLight, 0.35, 1, 900);
    this.label(1200, 520, "AIRLOCK → LAUNCH", CSS.dim, 11).setOrigin(1, 0.5);
    this.drawAirlock(false);
  }

  private drawAirlock(open: boolean) {
    const g = this.doorGfx;
    g.clear();
    g.fillStyle(C.steel, 1).fillRect(1248, 380, 26, 120);
    g.fillStyle(open ? C.cyanDeep : C.charcoal, 1).fillRect(1252, 386, 18, 108);
    g.lineStyle(2, open ? C.cyan : C.amber, 0.9).strokeRect(1252, 386, 18, 108);
    if (!open) {
      for (let i = 0; i < 5; i++) g.fillStyle(C.amber, 0.6).fillRect(1254, 392 + i * 21, 14, 6);
    }
    this.doorLight.setFillStyle(open ? C.green : C.amber);
  }

  private block(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.obstacles.add(z);
    return z;
  }

  private label(x: number, y: number, text: string, color: string = CSS.moon, size = 12) {
    return this.add.text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2 });
  }

  private tweenGlow(target: Phaser.GameObjects.GameObject, from: number, to: number, duration: number) {
    if (saveStore.get().settings.reducedMotion) return;
    (target as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(from);
    this.tweens.add({ targets: target, alpha: to, duration, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  private screen(x: number, y: number, w: number, h: number, color: number = C.cyan) {
    this.add.rectangle(x, y, w, h, C.screen).setStrokeStyle(1, color, 0.6);
    const glow = this.add.rectangle(x, y, w - 4, h - 4, color, 0.18);
    this.tweenGlow(glow, 0.1, 0.28, 1800 + Math.random() * 900);
    return glow;
  }

  private drawDecor() {
    const g = this.add.graphics();
    // Lockers on north wall
    for (const [sx, n] of [
      [330, 4],
      [790, 4],
    ] as const) {
      for (let i = 0; i < n; i++) {
        const x = sx + i * 42;
        g.fillStyle(C.steel, 1).fillRect(x, FLOOR.y, 38, 34);
        g.lineStyle(1, C.wallTrim, 1).strokeRect(x, FLOOR.y, 38, 34);
        g.fillStyle(C.moonDark, 1).fillRect(x + 28, FLOOR.y + 12, 3, 10);
      }
      this.block(sx, FLOOR.y, n * 42, 34);
    }
    // Supply crates
    const crate = (x: number, y: number, s: number) => {
      g.fillStyle(C.charcoal, 1).fillRect(x, y, s, s);
      g.lineStyle(2, C.amberDeep, 0.9).strokeRect(x + 1, y + 1, s - 2, s - 2);
      g.lineStyle(1, C.amberDeep, 0.6).lineBetween(x + 4, y + 4, x + s - 4, y + s - 4);
      this.block(x, y, s, s);
    };
    crate(560, 704, 50);
    crate(616, 716, 38);
    crate(700, 706, 44);
    this.label(560, 690, "SUPPLY", CSS.dim, 10);
    // Bench
    g.fillStyle(C.steel, 1).fillRoundedRect(380, 560, 120, 30, 6);
    g.lineStyle(1, C.wallTrim, 1).strokeRoundedRect(380, 560, 120, 30, 6);
    this.block(380, 560, 120, 30);
    g.fillStyle(C.steel, 1).fillRoundedRect(780, 560, 120, 30, 6);
    g.lineStyle(1, C.wallTrim, 1).strokeRoundedRect(780, 560, 120, 30, 6);
    this.block(780, 560, 120, 30);
  }

  private drawSuitStation() {
    const g = this.add.graphics();
    g.fillStyle(C.charcoal, 1).fillRoundedRect(140, 140, 140, 82, 8);
    g.lineStyle(2, C.steel, 1).strokeRoundedRect(140, 140, 140, 82, 8);
    // Suit on rack (top-down)
    g.fillStyle(C.steel, 1).fillRoundedRect(190, 176, 40, 28, 5);
    g.fillStyle(C.white, 1).fillEllipse(210, 182, 64, 34);
    g.fillStyle(C.white, 1).fillCircle(174, 180, 9).fillCircle(246, 180, 9);
    g.fillStyle(C.white, 1).fillCircle(210, 168, 15);
    g.lineStyle(2, C.moonDark, 1).strokeCircle(210, 168, 15);
    g.fillStyle(C.amber, 0.9).fillEllipse(210, 161, 20, 9);
    this.screen(262, 200, 20, 24);
    this.block(140, 140, 140, 82);
    this.registerLight("suit", 152, 150);
  }

  private drawOxygenRack() {
    const g = this.add.graphics();
    g.fillStyle(C.charcoal, 1).fillRoundedRect(1000, 140, 140, 82, 8);
    g.lineStyle(2, C.steel, 1).strokeRoundedRect(1000, 140, 140, 82, 8);
    const tank = (x: number, y: number, r: number, color: number) => {
      g.fillStyle(color, 1).fillCircle(x, y, r);
      g.lineStyle(2, C.moonDark, 1).strokeCircle(x, y, r);
      g.fillStyle(C.steel, 1).fillCircle(x, y, r * 0.35);
    };
    tank(1030, 180, 18, C.white);
    tank(1072, 180, 18, C.white);
    tank(1112, 186, 12, C.amber); // emergency backup
    g.lineStyle(3, C.cyanDeep, 1).lineBetween(1030, 202, 1112, 202);
    this.label(1100, 200, "B", CSS.bg, 10).setOrigin(0.5);
    this.block(1000, 140, 140, 82);
    this.registerLight("oxygen", 1128, 150);
  }

  private drawCommsConsole() {
    const g = this.add.graphics();
    g.fillStyle(C.charcoal, 1).fillRoundedRect(130, 660, 160, 80, 8);
    g.lineStyle(2, C.steel, 1).strokeRoundedRect(130, 660, 160, 80, 8);
    this.screen(170, 688, 56, 34);
    this.screen(240, 688, 56, 34, C.amber);
    // Little dish
    g.lineStyle(2, C.moon, 1).strokeCircle(160, 724, 9);
    g.fillStyle(C.moon, 1).fillCircle(160, 724, 3);
    for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? C.cyan : C.amber, 0.8).fillRect(190 + i * 12, 724, 8, 4);
    this.block(130, 660, 160, 80);
    this.registerLight("comms", 278, 670);
  }

  private drawEmergencyLocker() {
    const g = this.add.graphics();
    g.fillStyle(C.charcoal, 1).fillRoundedRect(940, 680, 140, 70, 8);
    g.lineStyle(2, C.amberDeep, 1).strokeRoundedRect(940, 680, 140, 70, 8);
    for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? C.charcoal : C.amber, 0.85).fillRect(944 + i * 22, 682, 22, 8);
    g.fillStyle(C.red, 0.9).fillRoundedRect(990, 708, 40, 28, 4);
    g.fillStyle(C.white, 1).fillRect(1006, 712, 8, 20).fillRect(1000, 718, 20, 8);
    this.block(940, 680, 140, 70);
    this.registerLight("emergency", 1068, 728);
  }

  private drawBoard() {
    const g = this.add.graphics();
    g.fillStyle(C.screen, 1).fillRect(560, 70, 160, 40);
    g.lineStyle(2, C.cyan, 0.6).strokeRect(560, 70, 160, 40);
    for (let i = 0; i < 4; i++) {
      g.fillStyle(C.cyan, 0.5).fillRect(572, 78 + i * 8, 10, 4);
      g.fillStyle(C.moonDark, 0.8).fillRect(588, 78 + i * 8, 100 - i * 12, 4);
    }
    const glow = this.add.rectangle(640, 90, 156, 36, C.cyan, 0.08);
    this.tweenGlow(glow, 0.05, 0.16, 2200);
  }

  private drawTerminal() {
    const g = this.add.graphics();
    g.fillStyle(C.charcoal, 1).fillRoundedRect(1176, 300, 60, 64, 8);
    g.lineStyle(2, C.steel, 1).strokeRoundedRect(1176, 300, 60, 64, 8);
    this.screen(1206, 324, 44, 30);
    this.terminalText = this.label(1206, 324, "LOCK", CSS.amber, 10).setOrigin(0.5);
    this.block(1176, 300, 60, 64);
  }

  private drawTable() {
    const g = this.add.graphics();
    g.fillStyle(C.charcoal, 1).fillRoundedRect(540, 390, 200, 100, 14);
    g.lineStyle(2, C.steel, 1).strokeRoundedRect(540, 390, 200, 100, 14);
    g.fillStyle(C.screen, 1).fillCircle(640, 440, 38);
    // Holographic Moon
    const moon = this.add.graphics();
    moon.fillStyle(C.moon, 0.9).fillCircle(0, 0, 22);
    moon.fillStyle(C.moonDark, 0.9).fillCircle(-7, -5, 5).fillCircle(8, 6, 4).fillCircle(4, -10, 3).fillCircle(-4, 10, 3);
    moon.setPosition(640, 440);
    const orbit = this.add.graphics();
    orbit.lineStyle(1, C.cyan, 0.7).strokeEllipse(0, 0, 70, 26);
    orbit.fillStyle(C.amber, 1).fillCircle(35, 0, 3);
    orbit.setPosition(640, 440);
    if (!saveStore.get().settings.reducedMotion) {
      this.tweens.add({ targets: orbit, angle: 360, duration: 9000, repeat: -1 });
    }
    this.label(640, 500, "MISSION TABLE", CSS.dim, 10).setOrigin(0.5, 0);
    this.block(540, 390, 200, 100);
  }

  private createAres() {
    const { x, y } = INTERACTABLES.ares;
    const shadow = this.add.ellipse(x, y + 22, 34, 12, 0x000000, 0.35);
    const body = this.add.graphics();
    body.fillStyle(C.moon, 1).fillCircle(0, 0, 18);
    body.lineStyle(2, C.moonDark, 1).strokeCircle(0, 0, 18);
    body.fillStyle(C.charcoal, 1).fillCircle(0, -3, 9);
    body.fillStyle(C.cyan, 1).fillCircle(0, -3, 5);
    body.fillStyle(C.amber, 1).fillRect(-15, -2, 3, 6).fillRect(12, -2, 3, 6);
    this.ares = this.add.container(x, y, [body]);
    this.block(x - 16, y - 16, 32, 32);
    if (!saveStore.get().settings.reducedMotion) {
      this.tweens.add({ targets: this.ares, y: y - 6, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: shadow, scaleX: 0.8, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
  }

  private registerLight(id: StationId, x: number, y: number) {
    const light = this.add.circle(x, y, 5, C.amber);
    this.tweenGlow(light, 0.4, 1, 800);
    this.markers.set(id, { ...(this.markers.get(id) as Marker), id, light });
  }

  private createMarkers() {
    const ids: InteractableId[] = [...STATION_IDS, "board", "terminal", "ares"];
    for (const id of ids) {
      const info = INTERACTABLES[id];
      const ring = this.add.graphics();
      ring.setPosition(info.x, info.y);
      const labelY = id === "ares" ? info.y - 46 : id === "board" ? info.y - 30 : info.y + 34;
      const label = this.label(info.x, labelY, info.label.toUpperCase(), CSS.moon, 13).setOrigin(0.5);
      label.setBackgroundColor("#0b1322cc").setPadding(6, 3, 6, 3);
      const existing = this.markers.get(id);
      this.markers.set(id, { id, ring, label, light: existing?.light });

      // Click/tap the anchor area to interact when close enough.
      const hit = this.add.zone(info.x, info.y, 120, 90).setInteractive({ useHandCursor: true });
      hit.on("pointerdown", () => {
        const s = missionStore.get();
        if (s.overlay === null && s.nearby === id) this.interact(id);
      });
    }
  }

  private interact(id: InteractableId) {
    if (id === "ares") openOverlay({ kind: "ares" });
    else openOverlay({ kind: "station", id });
  }

  private createPlayer() {
    this.playerShadow = this.add.ellipse(110, 432, 34, 14, 0x000000, 0.35);
    this.player = this.physics.add.image(110, 420, "astronaut");
    this.player.setDepth(10);
    this.playerShadow.setDepth(9);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCircle(14, 10, 10);
    body.setCollideWorldBounds(true);
    this.player.setRotation(this.facing + Math.PI / 2);
  }

  private createDust() {
    this.add
      .particles(0, 0, "dot", {
        x: { min: FLOOR.x, max: FLOOR.x + FLOOR.w },
        y: { min: FLOOR.y, max: FLOOR.y + FLOOR.h },
        lifespan: 7000,
        speedX: { min: -5, max: 5 },
        speedY: { min: -9, max: -2 },
        alpha: { start: 0.35, end: 0 },
        scale: { start: 0.45, end: 0.15 },
        tint: [C.cyan, C.moon, C.amber],
        frequency: 220,
        quantity: 1,
      })
      .setDepth(20);
  }

  // ------------------------------------------------------------ state sync
  private syncFromState(force = false) {
    const s = missionStore.get();
    const unlocked = allChecksDone(s.checks);
    const sig = `${STATION_IDS.map((id) => (s.checks[id] ? 1 : 0)).join("")}|${s.quiz.passed}|${s.nearby}|${s.boardInspected}`;
    if (!force && sig === this.lastSignature) return;
    this.lastSignature = sig;

    this.drawAirlock(s.quiz.passed);
    this.terminalText.setText(s.quiz.passed ? "PASS" : unlocked ? "READY" : "LOCK");
    this.terminalText.setColor(s.quiz.passed ? CSS.cyan : unlocked ? CSS.cyan : CSS.amber);

    for (const [id, m] of this.markers) {
      const done =
        id === "terminal" ? s.quiz.passed : id === "board" ? s.boardInspected : id === "ares" ? false : s.checks[id as StationId];
      const active = id === "terminal" ? unlocked : true;
      const near = s.nearby === id;
      const color = id === "ares" ? C.cyan : done ? C.green : active ? C.amber : C.moonDark;
      m.ring.clear();
      m.ring.lineStyle(near ? 3 : 2, color, near ? 1 : 0.55).strokeEllipse(0, 6, near ? 92 : 78, near ? 38 : 32);
      if (near) m.ring.fillStyle(color, 0.12).fillEllipse(0, 6, 92, 38);
      const base = INTERACTABLES[id].label.toUpperCase();
      m.label.setText(done && id !== "ares" ? `✓ ${base}` : base);
      m.label.setColor(done ? "#7fe0c0" : near ? CSS.amber : CSS.moon);
      m.light?.setFillStyle(done ? C.green : C.amber);
    }
  }

  // ---------------------------------------------------------------- update
  override update(time: number) {
    const s = missionStore.get();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const frozen = s.overlay !== null;
    const v = frozen ? { x: 0, y: 0 } : getMoveVector();
    body.setVelocity(v.x * SPEED, v.y * SPEED);

    const moving = v.x !== 0 || v.y !== 0;
    if (moving) {
      const target = Math.atan2(v.y, v.x);
      this.facing = Phaser.Math.Angle.RotateTo(this.facing, target, 0.25);
      this.player.setRotation(this.facing + Math.PI / 2);
      const bob = saveStore.get().settings.reducedMotion ? 0 : Math.sin(time / 70) * 0.035;
      this.player.setScale(1 + bob, 1 - bob);
    } else {
      this.player.setScale(1);
    }
    this.playerShadow.setPosition(this.player.x, this.player.y + 12);

    // Nearest interactable within range
    let best: InteractableId | null = null;
    let bestD = INTERACT_RANGE;
    for (const id of this.markers.keys()) {
      const info = INTERACTABLES[id];
      const ax = id === "ares" ? this.ares.x : info.x;
      const ay = id === "ares" ? this.ares.y + 30 : info.y;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, ax, ay);
      if (d < bestD) {
        bestD = d;
        best = id;
      }
    }
    if (best !== s.nearby) setNearby(best);
  }
}
