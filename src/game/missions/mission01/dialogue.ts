import type { DialogueLine, StationId } from "./types";
import { STATION_IDS } from "./types";

/** Dr. Elena / ARES lines keyed by event. Ids make each line play once per run. */
export const LINES = {
  trainingStart: {
    id: "elena-start",
    speaker: "elena",
    text: "Welcome to the Prep Bay, Commander. Four equipment checks stand between you and launch authorization. Take your time — I'd rather you be thorough than fast.",
  },
  aresStart: {
    id: "ares-start",
    speaker: "ares",
    text: "ARES online. Approach a glowing station and press E to inspect it. Press H any time for a hint or diagnostics.",
  },
  allChecks: {
    id: "elena-all-checks",
    speaker: "elena",
    text: "All four systems verified. Nicely done. Head to the Certification Terminal by the airlock on the east wall for your final questions.",
  },
  quizPass: {
    id: "elena-quiz-pass",
    speaker: "elena",
    text: "That's a pass, Commander. Your understanding is solid. Report to the terminal to proceed to mission evaluation.",
  },
  quizFail: {
    id: "elena-quiz-fail",
    speaker: "elena",
    text: "Not quite there yet — and that's fine. Review the science notes if you like, then try the quiz again. Nobody launches until they're ready.",
  },
  optionalDone: {
    id: "ares-optional",
    speaker: "ares",
    text: "Optional objective complete: all science notes read and checklist acknowledged. Bonus logged.",
  },
  evaluation: {
    id: "elena-eval",
    speaker: "elena",
    text: "I've reviewed your results. Let's look at them together.",
  },
} satisfies Record<string, DialogueLine>;

const CHECK_REACTIONS: Record<StationId, string> = {
  suit: "Suit integrity confirmed. Remember: that suit is your personal spacecraft out there.",
  oxygen: "Oxygen primary and backup look good, and the scrubber is clearing CO₂. Two different jobs, both essential.",
  comms: "I heard you, Commander — about 2.6 seconds later. Get used to that pause; on the Moon it's real.",
  emergency: "Emergency kit inventoried and procedure memorised. Preparation is what turns a crisis into a checklist.",
};

export function checkReaction(id: StationId, done: number): DialogueLine {
  const remaining = STATION_IDS.length - done;
  const tail = remaining > 0 ? ` ${done} of 4 checks complete.` : "";
  return { id: `elena-check-${id}`, speaker: "elena", text: CHECK_REACTIONS[id] + tail };
}

export const SPEAKER_NAMES = {
  elena: "Dr. Elena · Mission Control",
  ares: "ARES · Robotic Assistant",
  system: "Prep Bay System",
} as const;
