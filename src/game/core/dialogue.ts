/** Speakers and comms lines shared by every mission. */
export type Speaker = "elena" | "ares" | "system";

export interface DialogueLine {
  id: string;
  speaker: Speaker;
  text: string;
}
