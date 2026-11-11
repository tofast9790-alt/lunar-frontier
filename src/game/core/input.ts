/**
 * Movement input shared by keyboard and on-screen pad.
 * We listen on window ourselves (Phaser keyboard is disabled) so focus on a
 * button never swallows movement, and typing in form fields never moves the player.
 */
export type Dir = "up" | "down" | "left" | "right";

const KEY_MAP: Record<string, Dir> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

const keyboard = new Set<Dir>();
const virtual = new Set<Dir>();

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function attachMovementKeys(): () => void {
  const down = (e: KeyboardEvent) => {
    if (isEditableTarget(e.target)) return;
    const dir = KEY_MAP[e.code];
    if (!dir) return;
    keyboard.add(dir);
    if (e.code.startsWith("Arrow")) e.preventDefault();
  };
  const up = (e: KeyboardEvent) => {
    const dir = KEY_MAP[e.code];
    if (dir) keyboard.delete(dir);
  };
  const clear = () => {
    keyboard.clear();
    virtual.clear();
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clear);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
    clear();
  };
}

export function setVirtualDir(dir: Dir, pressed: boolean) {
  if (pressed) virtual.add(dir);
  else virtual.delete(dir);
}

export function clearMovement() {
  keyboard.clear();
  virtual.clear();
}

/** Normalised movement vector (-1..1). */
export function getMoveVector(): { x: number; y: number } {
  const has = (d: Dir) => keyboard.has(d) || virtual.has(d);
  let x = (has("right") ? 1 : 0) - (has("left") ? 1 : 0);
  let y = (has("down") ? 1 : 0) - (has("up") ? 1 : 0);
  if (x !== 0 && y !== 0) {
    x *= Math.SQRT1_2;
    y *= Math.SQRT1_2;
  }
  return { x, y };
}
