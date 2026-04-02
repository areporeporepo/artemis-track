// src/sprites.ts
import { C } from "./types.ts";

export const SPRITE_FRAMES: string[][] = [
  // Frame 0: idle
  [
    "            ",
    `   ${C.white}/\\${C.reset}       `,
    `  ${C.white}/${C.cyan}○○${C.white}\\${C.reset}     `,
    `  ${C.white}|${C.gray}_**_${C.white}|${C.reset}    `,
    `  ${C.orange}⊿⊿⊿⊿${C.reset}     `,
  ],
  // Frame 1: thrust (windows lit, exhaust right)
  [
    "            ",
    `   ${C.white}/\\${C.reset}       `,
    `  ${C.white}/${C.gold}●●${C.white}\\${C.reset}     `,
    `  ${C.white}|${C.gray}_**_${C.white}|${C.reset}    `,
    `  ${C.orange}⊿⊿⊿⊿${C.dim}~${C.reset}    `,
  ],
  // Frame 2: boost (particles above and below)
  [
    `  ${C.dim}~ ~${C.reset}       `,
    `   ${C.white}/\\${C.reset}       `,
    `  ${C.white}/${C.cyan}○○${C.white}\\${C.reset}     `,
    `  ${C.white}|${C.gray}_**_${C.white}|${C.reset}    `,
    `  ${C.dim}~${C.orange}⊿⊿⊿⊿${C.dim}~${C.reset}   `,
  ],
];

const IDLE_SEQUENCE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0, 0, 1, 0];
const NAME_LABEL = `  ${C.gold}Orion${C.reset}     `;

export function getSpriteFrame(tick: number): string {
  const frameIndex = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!;
  const lines = [...SPRITE_FRAMES[frameIndex]!, NAME_LABEL];
  return lines.join("\n");
}

export function getSpriteLines(tick: number): string[] {
  const frameIndex = IDLE_SEQUENCE[tick % IDLE_SEQUENCE.length]!;
  return [...SPRITE_FRAMES[frameIndex]!, NAME_LABEL];
}
