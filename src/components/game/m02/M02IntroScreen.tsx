import descentImg from "@/assets/m02-descent.jpg";
import cockpitImg from "@/assets/m02-cockpit.jpg";
import elenaImg from "@/assets/intro-elena.jpg";
import { SPEAKER_NAMES } from "@/game/missions/mission02/dialogue";
import { m02Store, setPhase } from "@/game/missions/mission02/state";
import { StorySequence, type StoryPanel } from "../StorySequence";

const PANELS: StoryPanel[] = [
  {
    kicker: "Lunar orbit · day 3",
    title: "The Moon fills the window",
    image: cockpitImg,
    imageAlt: "Commander at the lander controls with the cratered Moon below",
    text: "Your lander has separated from the transfer ship. Below you, the south polar region slides past: craters inside craters, and shadows longer than mountains.",
  },
  {
    kicker: "Mission Control · incoming",
    title: "Dr. Elena",
    image: elenaImg,
    speaker: "elena",
    text: "Commander, nobody has landed at this outpost site before. There's no runway and no air to glide on. It's you, the engine, and the fuel in your tanks.",
  },
  {
    kicker: "Mission 02 · Touchdown",
    title: "First footsteps",
    image: descentImg,
    imageAlt: "Lander firing its engine above the lunar surface with a low Sun",
    text: "Check the lander, choose where to land, bring it down gently — then step outside and plant the beacon that every future crew will follow.",
  },
];

export function M02IntroScreen() {
  return (
    <StorySequence
      panels={PANELS}
      names={SPEAKER_NAMES}
      finalLabel="Mission briefing"
      onDone={() => setPhase("briefing")}
      isBlocked={() => m02Store.get().overlay !== null}
    />
  );
}
