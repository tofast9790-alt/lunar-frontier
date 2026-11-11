import Phaser from "phaser";
import { getMoveVector } from "@/game/core/input";
import { saveStore } from "@/game/persistence/save";
import { SURFACE, SURFACE_POINTS } from "@/game/missions/mission02/data";
import { m02Store, setNearby, warnCrater } from "@/game/missions/mission02/state";
import type { SurfaceId } from "@/game/missions/mission02/types";
import { C } from "./palette";
import { makeCommonTextures, makeLanderTexture } from "./textures";

const INTERACT_RANGE = 80;
/** Low gravity: slow to start, slow to stop. */
const ACCEL = 330;
const MAX_SPEED = 150;
const DRAG = 170;
const FONT = '"IBM Plex Mono", ui-monospace, monospace';
/** Long low-Sun shadows always point map-grid east (the Sun is west). */
const SHADOW_DX = 1;

const GROUND = 0x5f6876;

interface Marker {
  ring: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
}

export class SurfaceScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Image;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private markers = new Map<SurfaceId, Marker>();
  private beaconGfx!: Phaser.GameObjects.Container;
  private beaconPulse?: Phaser.GameObjects.Arc;
  private prints: Phaser.GameObjects.Image[] = [];
  private lastPrint = { x: 0, y: 0 };
  private footLeft = false;
  private facing = -Math.PI / 2;
  private bob = 0;
  private unsub: (() => void) | null = null;
  private signature = "";

  constructor() {
    super("Surface");
  }

  create() {
    makeCommonTextures(this);
    makeLanderTexture(this);
    this.makePrintTexture();
    const { width: W, height: H } = SURFACE;
    this.cameras.main.setBackgroundColor(0x05080f);
    this.physics.world.setBounds(40, 40, W - 80, H - 80);
    this.obstacles = this.physics.add.staticGroup();

    this.drawGround();
    this.drawCrater();
    this.drawRocks();
    this.drawLander();
    this.createMarkers();
    this.createBeacon();
    this.createPlayer();
    this.physics.add.collider(this.player, this.obstacles);

    this.fitCamera(this.scale.width, this.scale.height);
    this.scale.on("resize", this.onResize, this);
    this.unsub = m02Store.subscribe(() => this.sync());
    this.sync(true);

    if (import.meta.env.DEV) (window as unknown as { __lfSurface?: SurfaceScene }).__lfSurface = this;
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
    cam.setZoom(Phaser.Math.Clamp(Math.min(w / 1150, h / 820), 0.7, 1.4));
    cam.setBounds(0, 0, SURFACE.width, SURFACE.height);
    if (this.player) cam.startFollow(this.player, true, 0.1, 0.1);
  }

  private makePrintTexture() {
    if (this.textures.exists("bootprint")) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x3b424f, 1).fillRoundedRect(1, 0, 7, 12, 3);
    g.fillStyle(0x4b5260, 1).fillRect(2, 3, 5, 1).fillRect(2, 6, 5, 1).fillRect(2, 9, 5, 1);
    g.generateTexture("bootprint", 9, 12);
    g.destroy();
  }

  // ---------------------------------------------------------------- world
  private drawGround() {
    const { width: W, height: H } = SURFACE;
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(GROUND, 1).fillRect(0, 0, W, H);
    const rand = new Phaser.Math.RandomDataGenerator(["m02-surface"]);
    for (let i = 0; i < 420; i++) {
      g.fillStyle(rand.pick([0x6c7584, 0x535b69, 0x67707e]), rand.realInRange(0.15, 0.4));
      g.fillCircle(rand.between(0, W), rand.between(0, H), rand.between(6, 46));
    }
    // Small walkable craters.
    for (let i = 0; i < 16; i++) {
      const x = rand.between(80, W - 80);
      const y = rand.between(80, H - 80);
      if (Phaser.Math.Distance.Between(x, y, SURFACE.lander.x, SURFACE.lander.y) < 220) continue;
      if (Phaser.Math.Distance.Between(x, y, SURFACE.crater.x, SURFACE.crater.y) < SURFACE.crater.r + 80) continue;
      const r = rand.between(14, 40);
      g.fillStyle(0x7a8392, 0.6).fillCircle(x + 3, y, r * 1.08);
      g.fillStyle(0x464d5a, 1).fillCircle(x, y, r);
      g.fillStyle(0x575f6c, 1).fillCircle(x + r * 0.3, y, r * 0.7);
    }
    // Map-grid compass in the corner of the world.
    const t = this.add.text(70, 70, "N ↑  map grid", { fontFamily: FONT, fontSize: "13px", color: "#8b97aa" }).setDepth(1);
    t.setAlpha(0.8);
  }

  private drawCrater() {
    const { x, y, r } = SURFACE.crater;
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x7a8392, 0.7).fillCircle(x + 10, y, r + 26);
    g.fillStyle(0x0a0f19, 1).fillCircle(x, y, r);
    g.fillStyle(0x111826, 1).fillCircle(x + r * 0.3, y, r * 0.6);
    g.lineStyle(5, 0x2a3242, 1).strokeCircle(x, y, r);
    this.add
      .text(x - 80, y - r * 0.55, "PERMANENT SHADOW\n< −200 °C (sim)", {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#8b97aa",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  private rock(x: number, y: number, r: number) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x1d222b, 0.55).fillEllipse(x + SHADOW_DX * r * 2.2, y + r * 0.2, r * 4.6, r * 1.3);
    g.fillStyle(0x8d95a3, 1).fillCircle(x, y, r);
    g.fillStyle(0x5d6573, 1).fillCircle(x + r * 0.35, y + r * 0.2, r * 0.65);
    g.fillStyle(0xc3cad4, 0.8).fillCircle(x - r * 0.4, y - r * 0.3, r * 0.28);
    if (r > 10) {
      const z = this.add.zone(x, y, r * 1.6, r * 1.6);
      this.obstacles.add(z);
    }
  }

  private drawRocks() {
    const spots: [number, number, number][] = [
      [330, 300, 26], [420, 860, 18], [900, 260, 14], [980, 700, 22], [1460, 300, 30],
      [1580, 620, 16], [260, 620, 12], [800, 980, 20], [1300, 560, 9], [520, 180, 10],
      [1060, 1040, 12], [1650, 180, 20], [180, 1020, 24], [1240, 230, 8], [860, 520, 7],
    ];
    for (const [x, y, r] of spots) this.rock(x, y, r);
  }

  private drawLander() {
    const { x, y } = SURFACE.lander;
    const size = 250;
    this.add.image(x + 170, y + 8, "lander").setTint(0x000000).setAlpha(0.4).setDisplaySize(size * 2.1, size * 0.85).setDepth(3);
    this.add.image(x, y, "lander").setDisplaySize(size, size).setDepth(6);
    // Ladder down the south side.
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(C.amberDeep, 1).fillRect(x - 14, y + 66, 4, 54).fillRect(x + 10, y + 66, 4, 54);
    for (let i = 0; i < 5; i++) g.fillRect(x - 14, y + 72 + i * 11, 28, 3);
    const body = this.add.zone(x, y, 150, 150);
    this.obstacles.add(body);
  }

  private createMarkers() {
    for (const id of ["beacon", "sample", "lander"] as SurfaceId[]) {
      const p = SURFACE_POINTS[id];
      const ring = this.add.graphics().setDepth(2);
      const label = this.add
        .text(p.x, p.y + 44, p.label.toUpperCase(), { fontFamily: FONT, fontSize: "12px", color: "#f2b45a" })
        .setOrigin(0.5, 0)
        .setDepth(12);
      this.markers.set(id, { ring, label });
      if (!saveStore.get().settings.reducedMotion) {
        this.tweens.add({ targets: ring, alpha: { from: 1, to: 0.45 }, duration: 900, yoyo: true, repeat: -1 });
      }
    }
  }

  private createBeacon() {
    const p = SURFACE_POINTS.beacon;
    const shadow = this.add.rectangle(46, 4, 70, 8, 0x000000, 0.4);
    const legs = this.add.graphics();
    legs.lineStyle(3, C.amberDeep, 1).lineBetween(0, 0, -14, 12).lineBetween(0, 0, 14, 12).lineBetween(0, 0, 0, -14);
    const mast = this.add.circle(0, 0, 6, C.steel, 1);
    // Vertical panel seen from above = a thin bar facing west.
    const panel = this.add.rectangle(-10, 0, 6, 34, 0x274b7a, 1).setStrokeStyle(1.5, C.cyan, 1);
    const light = this.add.circle(0, 0, 3, C.cyan, 1);
    this.beaconGfx = this.add.container(p.x, p.y, [shadow, legs, mast, panel, light]).setDepth(7).setVisible(false);
    if (!saveStore.get().settings.reducedMotion) {
      this.beaconPulse = this.add.circle(p.x, p.y, 14, C.cyan, 0).setStrokeStyle(2, C.cyan, 0.8).setDepth(7).setVisible(false);
      this.tweens.add({ targets: this.beaconPulse, scale: { from: 1, to: 6 }, alpha: { from: 1, to: 0 }, duration: 1800, repeat: -1 });
    }
  }

  private createPlayer() {
    const s = SURFACE.playerStart;
    this.playerShadow = this.add.ellipse(s.x + 26, s.y + 4, 64, 18, 0x000000, 0.4).setDepth(8);
    this.player = this.physics.add.image(s.x, s.y, "astronaut").setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(DRAG, DRAG).setMaxVelocity(MAX_SPEED, MAX_SPEED);
    this.player.setCircle(15, 9, 12);
    this.lastPrint = { ...s };
  }

  // ----------------------------------------------------------------- state
  private sync(force = false) {
    const s = m02Store.get();
    const sig = `${s.beacon.deployed}|${s.sampleCollected}`;
    if (!force && sig === this.signature) return;
    this.signature = sig;
    const draw = (id: SurfaceId, done: boolean) => {
      const m = this.markers.get(id);
      if (!m) return;
      const p = SURFACE_POINTS[id];
      const colour = done ? C.green : C.amber;
      m.ring.clear();
      m.ring.lineStyle(3, colour, 1).strokeCircle(p.x, p.y, 34);
      m.ring.fillStyle(colour, 0.12).fillCircle(p.x, p.y, 34);
      m.label.setColor(done ? "#7fe0c0" : "#f2b45a");
    };
    draw("beacon", s.beacon.deployed);
    draw("sample", s.sampleCollected);
    draw("lander", false);
    this.beaconGfx.setVisible(s.beacon.deployed);
    this.beaconPulse?.setVisible(s.beacon.deployed);
  }

  // ------------------------------------------------------------------ loop
  update(_t: number, deltaMs: number) {
    const st = m02Store.get();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const blocked = st.overlay !== null || st.phase !== "surface";
    const mv = blocked ? { x: 0, y: 0 } : getMoveVector();
    body.setAcceleration(mv.x * ACCEL, mv.y * ACCEL);
    if (blocked) body.setVelocity(body.velocity.x * 0.9, body.velocity.y * 0.9);

    // Keep out of the shadowed crater: push back to the rim.
    const c = SURFACE.crater;
    const dx = this.player.x - c.x;
    const dy = this.player.y - c.y;
    const d = Math.hypot(dx, dy);
    const rim = c.r - 6;
    if (d < rim) {
      this.player.setPosition(c.x + (dx / d) * rim, c.y + (dy / d) * rim);
      body.setVelocity(0, 0);
    }
    if (d < c.r + 50) warnCrater();

    const speed = body.velocity.length();
    if (speed > 10) {
      const target = Math.atan2(body.velocity.y, body.velocity.x);
      this.facing = Phaser.Math.Angle.RotateTo(this.facing, target, 0.15);
      this.bob += deltaMs * 0.009;
    } else {
      this.bob = 0;
    }
    // Bunny-hop gait: higher hop → bigger sprite and longer shadow offset.
    const hop = Math.abs(Math.sin(this.bob)) * Math.min(1, speed / MAX_SPEED);
    this.player.setRotation(this.facing + Math.PI / 2).setScale(1 + hop * 0.12);
    this.playerShadow.setPosition(this.player.x + 26 + hop * 14, this.player.y + 4);

    this.footprints(hop);

    let nearest: SurfaceId | null = null;
    let best = INTERACT_RANGE;
    for (const id of ["beacon", "sample", "lander"] as SurfaceId[]) {
      const p = SURFACE_POINTS[id];
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
      if (dist < best) {
        best = dist;
        nearest = id;
      }
    }
    setNearby(blocked ? null : nearest);
  }

  private footprints(hop: number) {
    const moved = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lastPrint.x, this.lastPrint.y);
    if (moved < 30 || hop > 0.35) return;
    this.lastPrint = { x: this.player.x, y: this.player.y };
    this.footLeft = !this.footLeft;
    const side = this.footLeft ? -6 : 6;
    const px = this.player.x + Math.cos(this.facing + Math.PI / 2) * side;
    const py = this.player.y + Math.sin(this.facing + Math.PI / 2) * side;
    const print = this.add.image(px, py, "bootprint").setRotation(this.facing + Math.PI / 2).setDepth(1.5).setAlpha(0.85);
    this.prints.push(print);
    if (this.prints.length > 260) this.prints.shift()?.destroy();
  }
}
