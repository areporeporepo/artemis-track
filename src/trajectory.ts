import { C, EARTH_MOON_DISTANCE_KM } from "./types.ts";
import type { MissionPhase } from "./types.ts";

const ORBIT_WIDTH = 10;
const ARC_WIDTH = 14;
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

function fmtDist(km: number): string {
  return km >= 1000 ? `${Math.round(km / 1000)}k` : `${Math.round(km)}`;
}

function buildRing(pos: number): string {
  const before = "·".repeat(pos);
  const after = "·".repeat(ORBIT_WIDTH - 1 - pos);
  return `${C.gray}(${before}${C.reset}${C.gold}${C.bold}◆${C.reset}${C.gray}${after})${C.reset}`;
}

function buildArc(pos: number, width: number): string {
  const chars: string[] = [];
  for (let i = 0; i < width; i++) {
    if (i === pos) {
      chars.push(`${C.gold}${C.bold}◆${C.reset}`);
    } else {
      const edgeDist = Math.min(i, width - 1 - i);
      chars.push(`${C.gray}${edgeDist < 2 ? "·" : "─"}${C.reset}`);
    }
  }
  return chars.join("");
}

// Earth orbit: 🌍(···◆·····)──────────────────354k🌕
function renderEarthOrbit(distanceEarthKm: number, distanceMoonKm: number, missionElapsedMs: number): string {
  const angle = (missionElapsedMs / ORBIT_PERIOD_MS) * 2 * Math.PI;
  const x = Math.sin(angle);
  const pos = Math.round(((x + 1) / 2) * (ORBIT_WIDTH - 1));
  const ring = buildRing(pos);
  const gap = "─".repeat(ARC_WIDTH);
  return `${C.blue}🌍${C.reset}${ring}${C.dim}${fmtDist(distanceEarthKm)}${C.reset} ${C.gray}${gap}${C.reset} ${C.dim}${fmtDist(distanceMoonKm)}${C.reset}${getMoonPhaseEmoji()}`;
}

// Lunar flyby: 🌍366k──────────────────(···◆·····)🌕
function renderLunarFlyby(distanceEarthKm: number, distanceMoonKm: number, missionElapsedMs: number): string {
  // Approximate lunar orbit period: ~2h for a flyby arc
  const period = 2 * 3_600_000;
  const angle = (missionElapsedMs / period) * 2 * Math.PI;
  const x = Math.sin(angle);
  const pos = Math.round(((x + 1) / 2) * (ORBIT_WIDTH - 1));
  const ring = buildRing(pos);
  const gap = "─".repeat(ARC_WIDTH);
  return `${C.blue}🌍${C.dim}${fmtDist(distanceEarthKm)}${C.reset} ${C.gray}${gap}${C.reset} ${C.dim}${fmtDist(distanceMoonKm)}${C.reset}${ring}${getMoonPhaseEmoji()}`;
}

// Transit/return: 🌍64k╭··─◆────────··╮354k🌕
function renderTransit(distanceEarthKm: number, distanceMoonKm: number, phase?: MissionPhase): string {
  const progress = Math.min(1, Math.max(0, distanceEarthKm / EARTH_MOON_DISTANCE_KM));
  const pos = Math.round(progress * (ARC_WIDTH - 1));
  const arc = buildArc(pos, ARC_WIDTH);
  const leftCap = phase === "return_to_earth" || phase === "reentry" ? "╮" : "╭";
  const rightCap = phase === "return_to_earth" || phase === "reentry" ? "╰" : "╮";
  return `${C.blue}🌍${C.dim}${fmtDist(distanceEarthKm)}${C.reset}${C.gray}${leftCap}${C.reset}${arc}${C.gray}${rightCap}${C.reset}${C.dim}${fmtDist(distanceMoonKm)}${C.reset}${getMoonPhaseEmoji()}`;
}

export function renderTrajectoryBar(
  distanceEarthKm: number,
  distanceMoonKm: number,
  phase?: MissionPhase,
  missionElapsedMs?: number,
): string {
  if (phase === "earth_orbit" && missionElapsedMs !== undefined) {
    return renderEarthOrbit(distanceEarthKm, distanceMoonKm, missionElapsedMs);
  }
  if (phase === "lunar_flyby" && missionElapsedMs !== undefined) {
    return renderLunarFlyby(distanceEarthKm, distanceMoonKm, missionElapsedMs);
  }
  return renderTransit(distanceEarthKm, distanceMoonKm, phase);
}
