import { C, EARTH_MOON_DISTANCE_KM } from "./types.ts";
import type { MissionPhase } from "./types.ts";

const ORBIT_WIDTH = 10;
const ARC_WIDTH = 16;
// LEO orbital period at ~400km altitude: ~92.5 minutes
const ORBIT_PERIOD_MS = 92.5 * 60_000;

// Moon phase from synodic cycle
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

function orbitPos(elapsedMs: number, periodMs: number): number {
  const angle = (elapsedMs / periodMs) * 2 * Math.PI;
  return Math.round(((Math.sin(angle) + 1) / 2) * (ORBIT_WIDTH - 1));
}

// Earth orbit: 🌍(···◆·····) 65k alt
// Only altitude matters — Moon is irrelevant while orbiting Earth
function renderEarthOrbit(distanceEarthKm: number, missionElapsedMs: number): string {
  const ring = buildRing(orbitPos(missionElapsedMs, ORBIT_PERIOD_MS));
  return `${C.blue}🌍${C.reset}${ring} ${C.dim}${fmtDist(distanceEarthKm)} alt${C.reset}`;
}

// Lunar flyby: (···◆·····)🌕 2k alt
// Only lunar altitude matters — Earth is 380k+ away, irrelevant
function renderLunarFlyby(distanceMoonKm: number, missionElapsedMs: number): string {
  const period = 2 * 3_600_000;
  const ring = buildRing(orbitPos(missionElapsedMs, period));
  return `${ring}${getMoonPhaseEmoji()} ${C.dim}${fmtDist(distanceMoonKm)} alt${C.reset}`;
}

// Reentry: 🌍(···◆·····) 12k alt
// Back to Earth altitude — same as earth_orbit but during descent
function renderReentry(distanceEarthKm: number, missionElapsedMs: number): string {
  const ring = buildRing(orbitPos(missionElapsedMs, 30_000));
  return `${C.blue}🌍${C.reset}${ring} ${C.dim}${fmtDist(distanceEarthKm)} alt${C.reset}`;
}

// Transit/return: 🌍95k╭··─◆──────────··╮289k🌕
// Both distances matter — you're between the two bodies
function renderTransit(distanceEarthKm: number, distanceMoonKm: number, phase?: MissionPhase): string {
  const progress = Math.min(1, Math.max(0, distanceEarthKm / EARTH_MOON_DISTANCE_KM));
  const pos = Math.round(progress * (ARC_WIDTH - 1));
  const chars: string[] = [];
  for (let i = 0; i < ARC_WIDTH; i++) {
    if (i === pos) {
      chars.push(`${C.gold}${C.bold}◆${C.reset}`);
    } else {
      const edgeDist = Math.min(i, ARC_WIDTH - 1 - i);
      chars.push(`${C.gray}${edgeDist < 2 ? "·" : "─"}${C.reset}`);
    }
  }
  const arc = chars.join("");
  const returning = phase === "return_to_earth";
  const leftCap = returning ? "╮" : "╭";
  const rightCap = returning ? "╰" : "╮";
  return `${C.blue}🌍${C.dim}${fmtDist(distanceEarthKm)}${C.reset}${C.gray}${leftCap}${C.reset}${arc}${C.gray}${rightCap}${C.reset}${C.dim}${fmtDist(distanceMoonKm)}${C.reset}${getMoonPhaseEmoji()}`;
}

export function renderTrajectoryBar(
  distanceEarthKm: number,
  distanceMoonKm: number,
  phase?: MissionPhase,
  missionElapsedMs?: number,
): string {
  const met = missionElapsedMs ?? 0;
  switch (phase) {
    case "earth_orbit":  return renderEarthOrbit(distanceEarthKm, met);
    case "lunar_flyby":  return renderLunarFlyby(distanceMoonKm, met);
    case "reentry":      return renderReentry(distanceEarthKm, met);
    case "complete":     return `${C.blue}🌍${C.reset} ${C.green}splashdown${C.reset} ${C.dim}mission complete${C.reset}`;
    default:             return renderTransit(distanceEarthKm, distanceMoonKm, phase);
  }
}
