import { C, EARTH_MOON_DISTANCE_KM } from "./types.ts";

const BAR_WIDTH = 24;

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

export function renderTrajectoryBar(
  distanceEarthKm: number,
  distanceMoonKm: number,
): string {
  // Use actual Earth-Moon distance for accurate bar position
  const progress = Math.min(1, Math.max(0, distanceEarthKm / EARTH_MOON_DISTANCE_KM));
  const pos = Math.round(progress * (BAR_WIDTH - 1));

  // Show distance labels in compact form
  const earthDist = distanceEarthKm >= 1000
    ? `${Math.round(distanceEarthKm / 1000)}k`
    : `${Math.round(distanceEarthKm)}`;
  const moonDist = distanceMoonKm >= 1000
    ? `${Math.round(distanceMoonKm / 1000)}k`
    : `${Math.round(distanceMoonKm)}`;

  const before = "─".repeat(pos);
  const after = "─".repeat(BAR_WIDTH - 1 - pos);
  const dots = `${C.gray}${before}${C.reset}${C.gold}${C.bold}◆${C.reset}${C.gray}${after}${C.reset}`;

  return `${C.blue}🌍${C.dim}${earthDist}${C.reset} ${dots} ${C.dim}${moonDist}${C.reset}${getMoonPhaseEmoji()}`;
}
