import { C, EARTH_MOON_DISTANCE_KM } from "./types.ts";
import type { MissionPhase } from "./types.ts";

const BAR_WIDTH = 24;
const ORBIT_WIDTH = 12;
// LEO orbital period at ~400km altitude: ~92.5 minutes
const ORBIT_PERIOD_MS = 92.5 * 60_000;

// Moon phase from synodic cycle
// Known new moon: Jan 29, 2025 12:36 UTC
const KNOWN_NEW = new Date("2025-01-29T12:36:00Z").getTime();
const SYNODIC = 29.53058867;

function getMoonPhaseEmoji(): string {
  const daysSince = (Date.now() - KNOWN_NEW) / 86_400_000;
  const phase = ((daysSince % SYNODIC) + SYNODIC) % SYNODIC;
  const idx = Math.round((phase / SYNODIC) * 8) % 8;
  return ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"][idx]!;
}

// Circular orbit projected onto 1D — sinusoidal oscillation
// Fast through center (perigee/apogee crossing), slow at edges (limbs)
function renderOrbitBar(distanceEarthKm: number, missionElapsedMs: number): string {
  const angle = (missionElapsedMs / ORBIT_PERIOD_MS) * 2 * Math.PI;
  // sin projects circular motion onto a line
  const x = Math.sin(angle);
  // Map [-1, 1] to [0, ORBIT_WIDTH-1]
  const pos = Math.round(((x + 1) / 2) * (ORBIT_WIDTH - 1));

  const alt = distanceEarthKm >= 1000
    ? `${Math.round(distanceEarthKm / 1000)}k`
    : `${Math.round(distanceEarthKm)}`;

  // Build the orbit ring
  const before = "·".repeat(pos);
  const after = "·".repeat(ORBIT_WIDTH - 1 - pos);
  const ring = `${C.gray}${before}${C.reset}${C.gold}${C.bold}◆${C.reset}${C.gray}${after}${C.reset}`;

  return `${C.blue}🌍${C.reset}${C.gray}(${C.reset}${ring}${C.gray})${C.reset} ${C.dim}${alt} alt${C.reset}`;
}

export function renderTrajectoryBar(
  distanceEarthKm: number,
  distanceMoonKm: number,
  phase?: MissionPhase,
  missionElapsedMs?: number,
): string {
  // Orbit visualization when still circling Earth
  if (phase === "earth_orbit" && missionElapsedMs !== undefined) {
    return renderOrbitBar(distanceEarthKm, missionElapsedMs);
  }

  // Curved arc trajectory — suggests the 3D free-return path
  const ARC_WIDTH = 18;
  const progress = Math.min(1, Math.max(0, distanceEarthKm / EARTH_MOON_DISTANCE_KM));
  const pos = Math.round(progress * (ARC_WIDTH - 1));

  const earthDist = distanceEarthKm >= 1000
    ? `${Math.round(distanceEarthKm / 1000)}k`
    : `${Math.round(distanceEarthKm)}`;
  const moonDist = distanceMoonKm >= 1000
    ? `${Math.round(distanceMoonKm / 1000)}k`
    : `${Math.round(distanceMoonKm)}`;

  // Build arc: ╭─·─◆─·─╮ with spacecraft diamond moving along it
  const chars: string[] = [];
  for (let i = 0; i < ARC_WIDTH; i++) {
    if (i === pos) {
      chars.push(`${C.gold}${C.bold}◆${C.reset}`);
    } else {
      // Dots near edges, dashes in middle — suggests curve
      const edgeDist = Math.min(i, ARC_WIDTH - 1 - i);
      chars.push(`${C.gray}${edgeDist < 2 ? "·" : "─"}${C.reset}`);
    }
  }

  const arc = chars.join("");
  const leftCap = phase === "return_to_earth" || phase === "reentry" ? "╮" : "╭";
  const rightCap = phase === "return_to_earth" || phase === "reentry" ? "╰" : "╮";

  return `${C.blue}🌍${C.dim}${earthDist}${C.reset}${C.gray}${leftCap}${C.reset}${arc}${C.gray}${rightCap}${C.reset}${C.dim}${moonDist}${C.reset}${getMoonPhaseEmoji()}`;
}
