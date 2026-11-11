import type { StationId } from "./types";

export interface QuizQuestion {
  id: string;
  topic: StationId;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_LENGTH = 3;
export const QUIZ_PASS_MARK = 2;

/** Pool of station-based questions; each attempt draws QUIZ_LENGTH of them. */
export const QUIZ_POOL: QuizQuestion[] = [
  {
    id: "q-suit",
    topic: "suit",
    prompt: "Why is a spacesuit described as more than just clothing?",
    options: [
      "It mainly shows which agency the astronaut works for.",
      "It keeps the body pressurised, supplies oxygen, regulates temperature and protects the astronaut.",
      "It is only there to keep lunar dust off the astronaut's skin.",
      "It makes the astronaut weigh less on the Moon.",
    ],
    correctIndex: 1,
    explanation:
      "A suit is a small personal spacecraft: pressure, oxygen, CO₂ removal, temperature control and protection all happen inside it.",
  },
  {
    id: "q-oxygen",
    topic: "oxygen",
    prompt: "Which statement about suit life support is correct?",
    options: [
      "Supplying oxygen automatically removes carbon dioxide.",
      "Carbon dioxide is harmless inside a sealed suit.",
      "Oxygen supply and CO₂ removal are separate functions, and both must work.",
      "A backup oxygen supply is only needed during training on Earth.",
    ],
    correctIndex: 2,
    explanation:
      "Oxygen comes from the tanks; CO₂ is removed by a scrubber. If either fails, the astronaut is in danger — that's why you checked both.",
  },
  {
    id: "q-comms",
    topic: "comms",
    prompt: "Why is there a short delay when talking to Mission Control from the Moon?",
    options: [
      "Radio signals travel at the speed of light, and the Moon is about 384,000 km away — roughly 1.3 s each way.",
      "Radios in space must warm up before every message.",
      "Signals have to bounce off the Sun first.",
      "There is no delay at all from the Moon.",
    ],
    correctIndex: 0,
    explanation:
      "Even light takes time. Over lunar distance a round trip is about 2.6 s; farther destinations have much longer delays.",
  },
  {
    id: "q-emergency",
    topic: "emergency",
    prompt: "What is the main reason crews use emergency checklists?",
    options: [
      "So they never need to talk to Mission Control.",
      "Checklists make sure important steps happen in the right order, even under stress.",
      "They are only needed by new astronauts.",
      "To keep a record for after the mission.",
    ],
    correctIndex: 1,
    explanation:
      "Stress makes people skip steps. A practised checklist keeps actions in order and reduces risk.",
  },
];

/** Picks QUIZ_LENGTH questions using the given random source (injectable for tests). */
export function drawQuiz(rand: () => number = Math.random): QuizQuestion[] {
  const pool = [...QUIZ_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, QUIZ_LENGTH);
}

export function isQuizPass(correct: number): boolean {
  return correct >= QUIZ_PASS_MARK;
}
