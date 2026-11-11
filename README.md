# LUNAR FRONTIER — Beyond Earth. A New Beginning.

A strictly **2D**, top-down educational lunar exploration game (ages 13–18).
This build is the first playable vertical slice: **Chapter 1 — The Arrival / Mission 01 — The Selection**.

## Play
1. Main menu → **Start Mission** → watch (or skip) the intro → read the briefing.
2. In the Prep Bay, walk to each glowing station and press **E**:
   Suit integrity, Oxygen system, Comms, Emergency kit. Complete every step, then confirm.
3. Use the **Certification Terminal** (east wall) — pass the quiz with 2 of 3 (retry any time).
4. Review your evaluation, launch, and see Mission 01 Complete. Progress is saved in this browser.

Controls: **WASD / Arrows** move · **E** interact · **H** ARES hints · **Esc** pause / close · **1–4** quiz answers.
Mouse/touch: on-screen pad + tap the interaction prompt.

## Scope (honest status)
- Implemented: Mission 01 prototype (~8–12 min). The full mission is planned at 15–25 min.
- Not implemented yet: Mission 02 (Touchdown) and later missions, radiation/power/food/water/rover systems. Mars is a future expansion.
- Values marked **SIM** are simplified for gameplay.

## Code map
- `src/game/missions/registry.ts` — campaign list (add new missions here)
- `src/game/missions/mission01/` — mission data, dialogue, quiz, scoring rules, run state
- `src/game/persistence/save.ts` — versioned localStorage save
- `src/game/phaser/` — Phaser 3 training-room scene + React mount
- `src/components/game/` — HUD, comms, station panels, quiz, screens
- `src/routes/` — `/` menu, `/play`, `/academy`, `/records`, `/settings`

Tests: `bunx vitest run` (mission rules: quiz pass mark, launch authorization, no duplicate rewards, save).
