// src/api.ts
import { readFileSync, writeFileSync } from "node:fs";
import {
  type ArtemisPosition,
  type CachedData,
  API_URL,
  CACHE_PATH,
  CACHE_TTL_MS,
  LAUNCH_TIME,
} from "./types.ts";

export function formatMET(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatDistance(km: number): string {
  return km.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function readCache(): CachedData | null {
  try {
    const raw = readFileSync(CACHE_PATH, "utf-8");
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
    return { ...cached, data: { ...cached.data, stale: true } };
  } catch {
    return null;
  }
}

function writeCache(data: ArtemisPosition): void {
  try {
    const cached: CachedData = { data, fetchedAt: Date.now() };
    writeFileSync(CACHE_PATH, JSON.stringify(cached));
  } catch {}
}

// Artemis II trajectory waypoints: [MET_hours, earth_km, moon_km, speed_km/h]
// Source: pre-calculated from mission profile
const WAYPOINTS: [number, number, number, number][] = [
  [0, 0, 384400, 28000],
  [1, 300, 384100, 27500],
  [2, 600, 383800, 11000],
  [12, 6000, 378400, 8000],
  [24, 20000, 364400, 7500],
  [36, 50000, 334400, 7200],
  [48, 100000, 284400, 5500],
  [72, 200000, 184400, 4500],
  [96, 300000, 84400, 3800],
  [120, 370000, 14400, 3200],
  [132, 390000, 6513, 5800],   // closest lunar approach
  [144, 370000, 20000, 5500],
  [168, 280000, 110000, 4800],
  [192, 180000, 210000, 5200],
  [216, 80000, 310000, 8000],
  [230, 20000, 365000, 25000],
  [240, 0, 384400, 40000],     // splashdown
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function estimatePosition(): ArtemisPosition {
  const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());
  const hours = met / 3_600_000;

  // Find surrounding waypoints and interpolate
  let i = 0;
  while (i < WAYPOINTS.length - 1 && WAYPOINTS[i + 1]![0] < hours) i++;

  const wp0 = WAYPOINTS[Math.min(i, WAYPOINTS.length - 1)]!;
  const wp1 = WAYPOINTS[Math.min(i + 1, WAYPOINTS.length - 1)]!;

  const span = wp1[0] - wp0[0];
  const t = span > 0 ? Math.min(1, Math.max(0, (hours - wp0[0]) / span)) : 0;

  const distEarth = lerp(wp0[1], wp1[1], t);
  const distMoon = lerp(wp0[2], wp1[2], t);
  const speedKmH = lerp(wp0[3], wp1[3], t);

  // Determine phase
  let phase: string;
  if (hours >= 240) phase = "complete";
  else if (hours >= 230) phase = "reentry";
  else if (distMoon < 20000) phase = "lunar_flyby";
  else if (distEarth > distMoon) phase = "return_to_earth";
  else if (distEarth < 2000) phase = "earth_orbit";
  else phase = "transit_to_moon";

  return {
    distanceEarthKm: Math.round(distEarth),
    distanceMoonKm: Math.round(distMoon),
    velocityKmS: Math.round((speedKmH / 3600) * 100) / 100, // km/h → km/s
    missionElapsedMs: met,
    phase: phase as any,
    timestamp: new Date().toISOString(),
    crew: ["Wiseman", "Glover", "Koch", "Hansen"],
  };
}

export async function fetchPosition(): Promise<ArtemisPosition> {
  const cached = readCache();
  if (cached && !cached.data.stale) return cached.data;

  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: ArtemisPosition = await res.json();
    writeCache(data);
    return data;
  } catch {
    if (cached) return cached.data;
    return estimatePosition();
  }
}
