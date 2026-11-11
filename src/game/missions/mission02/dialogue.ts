import type { DialogueLine } from "./types";

export const SPEAKER_NAMES = {
  elena: "Dr. Elena · Mission Control",
  ares: "ARES · Robotic Assistant",
  system: "Lander Computer",
} as const;

export const LINES = {
  cockpitStart: {
    id: "m02-elena-cockpit",
    speaker: "elena",
    text: "Good morning, Commander. Before we commit to powered descent I need three checks from you: engine and propellant, landing radar, and guidance alignment.",
  },
  aresCockpit: {
    id: "m02-ares-cockpit",
    speaker: "ares",
    text: "ARES riding along in the lander bay. Pick a system on the left panel to begin. Press H for hints.",
  },
  cockpitDone: {
    id: "m02-elena-cockpit-done",
    speaker: "elena",
    text: "All three systems are GO. Next: choose where we land. Take your time with the site data — this decision matters for years.",
  },
  siteGood: {
    id: "m02-elena-site-good",
    speaker: "elena",
    text: "Crater Rim Ridge confirmed. Sunlight, Earth in view and ice next door. Lander, you are GO for powered descent.",
  },
  descentStart: {
    id: "m02-ares-descent",
    speaker: "ares",
    text: "Hold Space to fire the main engine. WASD or arrows fire the side thrusters. Land inside the cyan ring: slower than 2 m/s, sideways under 1 m/s.",
  },
  landed: {
    id: "m02-elena-landed",
    speaker: "elena",
    text: "Contact confirmed… we copy your touchdown. The whole room is cheering, Commander. Welcome to the Moon.",
  },
  surfaceStart: {
    id: "m02-elena-surface",
    speaker: "elena",
    text: "Deploy the navigation beacon at the marked site east of the lander. Future landers will home in on it. Then come back to the ladder and report.",
  },
  aresSurface: {
    id: "m02-ares-surface",
    speaker: "ares",
    text: "Low gravity: you will keep sliding after you let go. Start stopping early. Stay away from the dark crater to the south-east.",
  },
  craterWarning: {
    id: "m02-ares-crater",
    speaker: "ares",
    text: "Caution: that crater floor is permanently shadowed — far below −200 °C. Sample from the rim only. Do not descend.",
  },
  beaconDone: {
    id: "m02-elena-beacon",
    speaker: "elena",
    text: "Beacon signal received loud and clear. That's the first light of our outpost. Head back to the lander ladder to report.",
  },
  sampleDone: {
    id: "m02-elena-sample",
    speaker: "elena",
    text: "Sample bagged. The lab team will be very happy to see what's in that regolith.",
  },
  optionalDone: {
    id: "m02-ares-optional",
    speaker: "ares",
    text: "Optional objective complete: every science note read and a rim sample collected. Bonus logged.",
  },
  evaluation: {
    id: "m02-elena-eval",
    speaker: "elena",
    text: "Let's review your landing together.",
  },
} satisfies Record<string, DialogueLine>;

export const SITE_FEEDBACK_ELENA =
  "Not that one, Commander. Read the site data again — think about power, radio and how the lander will stand.";

export function failLine(attempt: number): Omit<DialogueLine, "id"> {
  return {
    speaker: "elena",
    text:
      attempt >= 2
        ? "Abort again — that's all right. Watch your vertical speed below 50 m and save fuel by not hovering high up."
        : "The flight computer aborted to orbit. Everyone's safe. Take a breath and we'll try again.",
  };
}
