import { type MissionPhase, C } from "./types.ts";
import { fetchPosition, formatDistance, formatMET } from "./api.ts";
import { renderTrajectoryBar } from "./trajectory.ts";
import { getSpriteFrame } from "./sprites.ts";

const PHASE_LABELS: Record<MissionPhase, string> = {
  earth_orbit: "Earth Orbit",
  transit_to_moon: "Lunar Transit",
  lunar_flyby: "Lunar Flyby",
  return_to_earth: "Return to Earth",
  reentry: "Reentry",
  complete: "Splashdown",
};

function clear(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

async function render(tick: number): Promise<void> {
  const pos = await fetchPosition().catch(() => null);
  if (!pos) return;
  {
    clear();
    const trajectory = renderTrajectoryBar(
      pos.distanceEarthKm,
      pos.distanceMoonKm,
    );
    const phase = PHASE_LABELS[pos.phase] ?? pos.phase;
    const stale = pos.stale ? ` ${C.dim}(stale data)${C.reset}` : "";
    const sprite = getSpriteFrame(tick);
    const ago = pos.stale
      ? "signal lost"
      : `Updated ${Math.floor((Date.now() - new Date(pos.timestamp).getTime()) / 1000)}s ago`;

    const output = `
  ${C.gold}╔═══════════════════════════════════════════════════════╗${C.reset}
  ${C.gold}║${C.reset}          ${C.white}A R T E M I S   I I   T R A C K E R${C.reset}          ${C.gold}║${C.reset}
  ${C.gold}╚═══════════════════════════════════════════════════════╝${C.reset}

   ${trajectory}
                      ${C.gold}↑${C.reset} ${C.gray}Orion${C.reset}

   ${C.gray}Distance from Earth:${C.reset}  ${C.gold}${formatDistance(pos.distanceEarthKm)} km${C.reset}${stale}
   ${C.gray}Distance from Moon:${C.reset}   ${C.cyan}${formatDistance(pos.distanceMoonKm)} km${C.reset}
   ${C.gray}Velocity:${C.reset}             ${C.green}${pos.velocityKmS.toFixed(2)} km/s${C.reset}
   ${C.gray}Source:${C.reset}               ${C.dim}${pos.source ?? "local"}${C.reset}
   ${C.gray}Mission Elapsed:${C.reset}      ${C.white}${formatMET(pos.missionElapsedMs)}${C.reset}
   ${C.gray}Phase:${C.reset}                ${C.green}${phase}${C.reset}

   ${C.gray}Crew:${C.reset} ${C.white}Reid Wiseman${C.reset} ${C.gray}(CDR)${C.reset} · ${C.white}Victor Glover${C.reset} ${C.gray}(PLT)${C.reset}
         ${C.white}Christina Koch${C.reset} ${C.gray}(MS)${C.reset} · ${C.white}Jeremy Hansen${C.reset} ${C.gray}(MS)${C.reset}

${sprite}
   ${C.gray}Data: NASA AROW · ${ago}${C.reset}
   ${C.gray}Press Ctrl+C to exit${C.reset}
`;
    process.stdout.write(output);
  }
}

export function startTUI(): void {
  let tick = 0;
  let rendering = false;
  clear();
  render(tick);
  const interval = setInterval(() => {
    if (rendering) return;
    rendering = true;
    tick++;
    render(tick).finally(() => { rendering = false; });
  }, 1000);
  const cleanup = () => { clearInterval(interval); clear(); process.exit(0); };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
