import { C } from "./types.ts";

export const SPRITE_FRAMES: string[][] = [
  // Frame 0: idle — Orion MPCV with solar arrays (AROW style)
  [
    `    ${C.gray}.─${C.silver}╤${C.gray}─.${C.reset}      `,
    `   ${C.white}/${C.gray}·${C.cyan}○ ○${C.gray}·${C.white}\\${C.reset}     `,
    `  ${C.white}/${C.gray}·─────·${C.white}\\${C.reset}    `,
    `  ${C.silver}╘═══════╛${C.reset}    `,
    `${C.blue}╶──${C.gray}│${C.dim}▪ ▪ ▪${C.gray}│${C.blue}──╴${C.reset}`,
    `   ${C.gray}╰─────╯${C.reset}     `,
  ],
  // Frame 1: thrust (windows lit, engine firing)
  [
    `    ${C.gray}.─${C.silver}╤${C.gray}─.${C.reset}      `,
    `   ${C.white}/${C.gray}·${C.gold}● ●${C.gray}·${C.white}\\${C.reset}     `,
    `  ${C.white}/${C.gray}·─────·${C.white}\\${C.reset}    `,
    `  ${C.silver}╘═══════╛${C.reset}    `,
    `${C.blue}╶──${C.gray}│${C.dim}▪ ${C.orange}▾${C.dim} ▪${C.gray}│${C.blue}──╴${C.reset}`,
    `   ${C.gray}╰─${C.orange}─▿─${C.gray}─╯${C.reset}     `,
  ],
  // Frame 2: coast (solar panel glint)
  [
    `    ${C.gray}.─${C.silver}╤${C.gray}─.${C.reset}      `,
    `   ${C.white}/${C.gray}·${C.cyan}○ ○${C.gray}·${C.white}\\${C.reset}     `,
    `  ${C.white}/${C.gray}·─────·${C.white}\\${C.reset}    `,
    `  ${C.silver}╘═══════╛${C.reset}    `,
    `${C.gold}╶──${C.gray}│${C.dim}▪ ▪ ▪${C.gray}│${C.gold}──╴${C.reset}`,
    `   ${C.gray}╰─────╯${C.reset}     `,
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
