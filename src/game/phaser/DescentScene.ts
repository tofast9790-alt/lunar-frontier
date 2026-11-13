import * as Phaser from "phaser";
import { getMoveVector, isThrusting } from "@/game/core/input";
import { saveStore } from "@/game/persistence/save";
import {
  DESCENT,
  PSR,
  TERRAIN,
  evaluateTouchdown,
  initialDescent,
  isOutOfBounds,
  lostResult,
  stepDescent,
  type DescentState,
} from "@/game/missions/mission02/descent";
import { m02Store, resolveTouchdown, setCallout, updateTelemetry } from "@/game/missions/mission02/state";
import { C } from "./palette";
import { makeCommonTextures, makeLanderTexture } from "./textures";

/** World pixels per metre. */
const PX = 4;
const EXTENT = 420;
/** Shadow offset per metre of altitude (low polar Sun → long shadows, toward map-grid east). */
const SHADOW_PER_M = 0.9;

const GROUND = 0x596170;
const GROUND_LIT = 0x737c8b;
const GROUND_DARK = 0x3a414d;

/** Top-down powered descent: the camera looks straight down and the ground swells as you get lower. */
export class DescentScene extends Phaser.Scene {
  private sim: DescentState = initialDescent();
  private lander!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Image;
  private glow!: Phaser.GameObjects.Arc;
  private plume!: Phaser.GameObjects.Arc;
  private rcs!: Phaser.GameObjects.Graphics;
  private lzLabel!: Phaser.GameObjects.Text;
  private dust?: Phaser.GameObjects.Particles.ParticleEmitter;
  private baseZoom = 2.6;
  private lastTelemetry = 0;
  private said = new Set<string>();
  private done = false;

  constructor() {
    super("Descent");
  }

  create() {
    makeCommonTextures(this);
    makeLanderTexture(this);
    this.cameras.main.setBackgroundColor(0x05080f);
    this.drawTerrain();
    this.drawLandingZone();

    this.shadow = this.add.image(0, 0, "lander").setTint(0x000000).setAlpha(0.45).setDepth(5);
    this.glow = this.add.circle(0, 0, 10, C.amber, 0).setDepth(6);
    this.plume = this.add.circle(0, 0, 10, C.amber, 0).setDepth(9);
    this.lander = this.add.image(0, 0, "lander").setDepth(10);
    this.rcs = this.add.graphics().setDepth(11);

    if (!saveStore.get().settings.reducedMotion) {
      this.dust = this.add
        .particles(0, 0, "dot", {
          speed: { min: 60, max: 160 },
          lifespan: 700,
          scale: { start: 0.9, end: 0.2 },
          alpha: { start: 0.5, end: 0 },
          tint: [0xb9c2cf, 0x8d96a5],
          frequency: 25,
          quantity: 3,
          emitting: false,
        })
        .setDepth(7);
    }

    this.onResize(this.scale.gameSize);
    this.scale.on("resize", this.onResize, this);
    this.render();
    updateTelemetry(this.sim);

    if (import.meta.env.DEV) (window as unknown as { __lfDescent?: DescentScene }).__lfDescent = this;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  /** Dev/test hook: replace the simulation state. */
  setSim(patch: Partial<DescentState>) {
    this.sim = { ...this.sim, ...patch };
  }

  private cleanup() {
    this.scale.off("resize", this.onResize, this);
  }

  private onResize(size: Phaser.Structs.Size) {
    // At touchdown the 9 m lander fills ~95 px on a 800 px-tall view.
    this.baseZoom = Phaser.Math.Clamp(Math.min(size.width, size.height) / 300, 1.6, 3.4);
  }

  // ---------------------------------------------------------------- drawing
  private drawTerrain() {
    const g = this.add.graphics().setDepth(0);
    const E = EXTENT * PX;
    // Ground extends well past the flight boundary so wide/tall screens never show empty space.
    g.fillStyle(GROUND, 1).fillRect(-E * 4, -E * 4, E * 8, E * 8);

    // Soft regolith mottling.
    const rand = new Phaser.Math.RandomDataGenerator(["lunar-frontier-m02"]);
    for (let i = 0; i < 520; i++) {
      const x = rand.between(-E, E);
      const y = rand.between(-E, E);
      g.fillStyle(rand.pick([GROUND_LIT, GROUND_DARK, 0x646c7a]), rand.realInRange(0.08, 0.22));
      g.fillCircle(x, y, rand.between(8, 70));
    }

    // Permanently shadowed crater.
    const p = { x: PSR.x * PX, y: PSR.y * PX, r: PSR.r * PX };
    g.fillStyle(GROUND_LIT, 0.55).fillCircle(p.x + 14, p.y, p.r + 22);
    g.fillStyle(0x0a0f19, 1).fillCircle(p.x, p.y, p.r);
    g.fillStyle(0x121a28, 1).fillCircle(p.x + p.r * 0.35, p.y, p.r * 0.55);
    g.lineStyle(6, 0x2a3242, 1).strokeCircle(p.x, p.y, p.r);

    for (const c of TERRAIN.craters) this.drawCrater(g, c.x * PX, c.y * PX, c.r * PX);
    for (const b of TERRAIN.boulders) this.drawBoulder(g, b.x * PX, b.y * PX, b.r * PX);
  }

  private drawCrater(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
    // Sun from map-grid west: the western inner wall is shaded, the eastern rim catches light.
    g.fillStyle(GROUND_LIT, 0.7).fillCircle(x + r * 0.08, y, r * 1.08);
    g.fillStyle(GROUND_DARK, 1).fillCircle(x, y, r);
    g.fillStyle(0x4d5462, 1).fillCircle(x + r * 0.3, y, r * 0.72);
    g.lineStyle(Math.max(1.5, r * 0.06), 0x868f9e, 0.8).beginPath();
    g.arc(x, y, r, -Math.PI / 2.4, Math.PI / 2.4).strokePath();
  }

  private drawBoulder(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
    g.fillStyle(0x1d222b, 0.6).fillEllipse(x + r * 1.8, y + r * 0.1, r * 4.2, r * 1.5);
    g.fillStyle(0x8d95a3, 1).fillCircle(x, y, r);
    g.fillStyle(0x5d6573, 1).fillCircle(x + r * 0.35, y + r * 0.2, r * 0.65);
    g.fillStyle(0xc3cad4, 0.8).fillCircle(x - r * 0.4, y - r * 0.3, r * 0.3);
  }

  private drawLandingZone() {
    const g = this.add.graphics().setDepth(2);
    const R = DESCENT.lzRadius * PX;
    g.fillStyle(C.cyan, 0.06).fillCircle(0, 0, R);
    g.lineStyle(3, C.cyan, 0.9);
    const segs = 28;
    for (let i = 0; i < segs; i += 2) {
      g.beginPath();
      g.arc(0, 0, R, (i / segs) * Math.PI * 2, ((i + 1) / segs) * Math.PI * 2);
      g.strokePath();
    }
    g.lineStyle(2, C.cyan, 0.6).lineBetween(-12, 0, 12, 0).lineBetween(0, -12, 0, 12);
    g.fillStyle(C.amber, 1);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) g.fillCircle(dx * (R + 8), dy * (R + 8), 4);
    this.lzLabel = this.add
      .text(0, -R - 14, "LZ · SURVEYED", { fontFamily: '"IBM Plex Mono", monospace', fontSize: "14px", color: "#9ee7f2" })
      .setOrigin(0.5, 1)
      .setDepth(3);
  }

  // ------------------------------------------------------------------ loop
  override update(_time: number, deltaMs: number) {
    const st = m02Store.get();
    const flying = st.descent.status === "flying" && !this.done;
    if (flying && st.overlay === null) {
      const mv = getMoveVector();
      this.sim = stepDescent(this.sim, { thrust: isThrusting(), rcsX: mv.x, rcsY: mv.y }, Math.min(deltaMs / 1000, 0.1));
      this.callouts();
      if (this.sim.alt <= 0) {
        this.done = true;
        updateTelemetry(this.sim);
        resolveTouchdown(evaluateTouchdown(this.sim), this.sim);
      } else if (isOutOfBounds(this.sim)) {
        this.done = true;
        resolveTouchdown(lostResult(this.sim), this.sim);
      } else if (this.time.now - this.lastTelemetry > 80) {
        this.lastTelemetry = this.time.now;
        updateTelemetry(this.sim);
      }
    } else if (!flying) {
      // Engine off while waiting or after the result.
      this.sim = { ...this.sim, engine: false, rcsX: 0, rcsY: 0 };
    }
    this.render();
  }

  private callouts() {
    const s = this.sim;
    const once = (key: string, cond: boolean, text: string) => {
      if (cond && !this.said.has(key)) {
        this.said.add(key);
        setCallout(text);
      }
    };
    once("a250", s.alt < 250, "250 m — shadow not yet in view. Watch the descent rate.");
    once("a150", s.alt < 150, "150 m — your shadow is approaching from the east.");
    once("a80", s.alt < 80, `80 m — slow to under ${DESCENT.maxVs} m/s before contact.`);
    once("a30", s.alt < 30, "30 m — kicking up dust. Cancel sideways drift now.");
    once("a10", s.alt < 10, "10 m — steady… steady…");
    once("f50", s.fuel < 50, "Fuel 50%.");
    once("f25", s.fuel < 25, "Fuel 25% — no time to hover.");
    once("f10", s.fuel < 10, "Fuel 10% — BINGO. Commit to landing.");
    once("f0", s.fuel <= 0, "Fuel exhausted — engine out!");
  }

  private render() {
    const s = this.sim;
    const cam = this.cameras.main;
    const zoom = this.baseZoom / (1 + s.alt / 55);
    cam.setZoom(zoom);
    const lx = s.x * PX;
    const ly = s.y * PX;
    cam.centerOn(lx, ly);

    const trueSize = DESCENT.landerSize * PX * 1.4; // texture includes legs
    // The camera rides with the lander, so it keeps a constant on-screen size.
    const size = (trueSize * this.baseZoom) / zoom;
    this.lander.setPosition(lx, ly).setDisplaySize(size, size);

    const off = s.alt * SHADOW_PER_M * PX;
    this.shadow.setPosition(lx + off + trueSize * 0.35, ly).setDisplaySize(trueSize * 1.7, trueSize);

    const near = Phaser.Math.Clamp(1 - s.alt / 60, 0, 1);
    const flicker = 0.85 + Math.random() * 0.15;
    this.plume
      .setPosition(lx, ly)
      .setRadius(size * 0.22)
      .setFillStyle(C.amber, s.engine ? 0.55 * flicker : 0);
    this.glow
      .setPosition(lx, ly)
      .setRadius(trueSize * (0.6 + near * 1.4))
      .setFillStyle(C.amber, s.engine ? 0.12 + near * 0.25 : 0);

    this.rcs.clear();
    if (s.rcsX !== 0 || s.rcsY !== 0) {
      // Thruster puffs fire opposite to the push direction.
      this.rcs.fillStyle(C.white, 0.75);
      const d = size * 0.42;
      const ex = lx - s.rcsX * d;
      const ey = ly - s.rcsY * d;
      this.rcs.fillCircle(ex, ey, size * 0.06).fillCircle(ex - s.rcsX * size * 0.08, ey - s.rcsY * size * 0.08, size * 0.04);
    }

    if (this.dust) {
      const dusty = s.engine && s.alt < 30 && s.alt > 0;
      this.dust.setPosition(lx, ly);
      if (dusty && !this.dust.emitting) this.dust.start();
      if (!dusty && this.dust.emitting) this.dust.stop();
    }

    this.lzLabel.setScale(1 / zoom);
  }
}
