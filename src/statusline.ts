// src/statusline.ts
import { type ArtemisPosition, C } from "./types.ts";
import { formatDistance, formatMET } from "./api.ts";
import { getSpriteLines } from "./sprites.ts";
import { renderTrajectoryBar, renderCrewLine } from "./trajectory.ts";

const PHASE_LABELS: Record<string, string> = {
  earth_orbit: "earth orbit",
  transit_to_moon: "lunar transit",
  lunar_flyby: "lunar flyby",
  return_to_earth: "return",
  reentry: "reentry",
  complete: "splashdown",
};

function renderBubble(pos: ArtemisPosition): string[] {
  const dist = formatDistance(pos.distanceEarthKm);
  const vel = pos.velocityKmS.toFixed(1);
  const met = formatMET(pos.missionElapsedMs);
  const phase = PHASE_LABELS[pos.phase] ?? pos.phase;
  const staleFlag = pos.stale ? ` ${C.dim}(stale)${C.reset}` : "";

  const line1 = `${C.gold}${dist} km${C.reset} ${C.cyan}${vel} km/s${C.reset} ${C.gray}MET ${met}${C.reset}${staleFlag}`;
  const line2 = `${C.green}▸ ${phase}${C.reset}`;

  return [
    `${C.cyan}╭──────────────────────────────────╮${C.reset}`,
    `${C.cyan}│${C.reset} ${line1} ${C.cyan}│${C.reset}`,
    `${C.cyan}│${C.reset} ${line2}                              ${C.cyan}│${C.reset}`,
    `${C.cyan}╰──────────────────────────────────╯${C.reset}`,
    `${C.cyan} ╲${C.reset}`,
  ];
}

export function renderStatusline(pos: ArtemisPosition, tick: number): string {
  const bubble = renderBubble(pos);
  const spriteLines = getSpriteLines(tick);
  const trajectory = renderTrajectoryBar(
    pos.distanceEarthKm,
    pos.distanceMoonKm,
  );
  const crew = renderCrewLine(pos.crew);

  const lines: string[] = [
    ...bubble,
    `${spriteLines[0]}  ${trajectory}`,
    `${spriteLines[1]}`,
    `${spriteLines[2]}  ${crew}`,
    `${spriteLines[3]}`,
    `${spriteLines[4]}`,
    `${spriteLines[5] ?? ""}`,
  ];

  return lines.join("\n");
}
