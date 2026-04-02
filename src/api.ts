import { readFileSync, writeFileSync } from "node:fs";
import {
  type ArtemisPosition,
  type CachedData,
  type MissionPhase,
  API_URL,
  CACHE_PATH,
  CACHE_TTL_MS,
  LAUNCH_TIME,
  EARTH_MOON_DISTANCE_KM,
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

const distFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
export function formatDistance(km: number): string {
  return distFmt.format(km);
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

// ── JPL Horizons API — fallback when CF Worker is down ──
const HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";
const CREW = ["Wiseman", "Glover", "Koch", "Hansen"];

function buildQS(command: string, start: Date, stop: Date): string {
  const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
  return [
    "format=json", `COMMAND=%27${command}%27`, "EPHEM_TYPE=VECTORS",
    "CENTER=%27500%40399%27",
    `START_TIME=%27${encodeURIComponent(fmt(start))}%27`,
    `STOP_TIME=%27${encodeURIComponent(fmt(stop))}%27`,
    "STEP_SIZE=%271%20min%27", "VEC_TABLE=%272%27",
  ].join("&");
}

function parseVec(result: string) {
  let inData = false, px = 0, py = 0, pz = 0, vx = 0, vy = 0, vz = 0;
  for (const line of result.split("\n")) {
    if (line.includes("$$SOE")) { inData = true; continue; }
    if (line.includes("$$EOE")) break;
    if (!inData) continue;
    const nums = [...line.matchAll(/[-+]?\d+\.\d+E[+-]\d+/g)].map((m) => parseFloat(m[0]));
    if (nums.length === 3) {
      if (Math.abs(nums[0]) > 100) { px = nums[0]; py = nums[1]; pz = nums[2]; }
      else { vx = nums[0]; vy = nums[1]; vz = nums[2]; }
    }
  }
  return px === 0 && py === 0 ? null : { px, py, pz, vx, vy, vz };
}

async function fetchHorizons(): Promise<ArtemisPosition> {
  const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());
  const now = new Date();
  const start = new Date(now.getTime() - 60_000);

  // Orion + Moon in parallel — real vector distance, no approximation
  const [orionRes, moonRes] = await Promise.all([
    fetch(`${HORIZONS_URL}?${buildQS("-1024", start, now)}`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${HORIZONS_URL}?${buildQS("301", start, now)}`, { signal: AbortSignal.timeout(8000) }),
  ]);

  if (!orionRes.ok) throw new Error(`Horizons HTTP ${orionRes.status}`);
  const orionData = await orionRes.json() as { result: string; error?: string };
  if (orionData.error) throw new Error(orionData.error);
  const o = parseVec(orionData.result);
  if (!o) throw new Error("No Orion state vector");

  const distEarth = Math.sqrt(o.px ** 2 + o.py ** 2 + o.pz ** 2);
  const speed = Math.sqrt(o.vx ** 2 + o.vy ** 2 + o.vz ** 2);

  let distMoon = Math.max(0, EARTH_MOON_DISTANCE_KM - distEarth);
  if (moonRes.ok) {
    const moonData = await moonRes.json() as { result: string; error?: string };
    if (!moonData.error) {
      const m = parseVec(moonData.result);
      if (m) {
        distMoon = Math.sqrt((o.px - m.px) ** 2 + (o.py - m.py) ** 2 + (o.pz - m.pz) ** 2);
      }
    }
  }

  const phase: MissionPhase = met >= 240 * 3_600_000 ? "complete"
    : met >= 230 * 3_600_000 ? "reentry"
    : distMoon < 20000 ? "lunar_flyby"
    : distEarth > distMoon ? "return_to_earth"
    : distEarth < 2000 ? "earth_orbit"
    : "transit_to_moon";

  return {
    distanceEarthKm: Math.round(distEarth),
    distanceMoonKm: Math.round(distMoon),
    velocityKmS: Math.round(speed * 100) / 100,
    missionElapsedMs: met,
    phase,
    timestamp: now.toISOString(),
    crew: CREW,
  };
}

// Interpolate distance using velocity between data points
// So the km counter ticks every render, not every 5s
const LAUNCH_EPOCH = LAUNCH_TIME.getTime();

// No monotonic locking — interpolation is smooth because we hold cache
// long enough that we don't re-fetch mid-interpolation cycle

function interpolate(data: ArtemisPosition): ArtemisPosition {
  const now = Date.now();
  const met = Math.max(0, now - LAUNCH_EPOCH);

  if (data.velocityKmS === 0) return { ...data, missionElapsedMs: met };

  // Only interpolate distance during phases with clear radial direction
  if (data.phase === "earth_orbit" || data.phase === "lunar_flyby") {
    return { ...data, missionElapsedMs: met };
  }

  const dataAge = (now - new Date(data.timestamp).getTime()) / 1000;
  if (dataAge <= 0) return data;

  const dt = Math.min(dataAge, 600);
  const dKm = data.velocityKmS * dt;

  const outbound = data.phase === "transit_to_moon";
  const sign = outbound ? 1 : -1;

  const earthKm = Math.max(0, Math.round(data.distanceEarthKm + sign * dKm));
  const moonKm = Math.max(0, Math.round(data.distanceMoonKm - sign * dKm));

  return { ...data, distanceEarthKm: earthKm, distanceMoonKm: moonKm, missionElapsedMs: met };
}

export async function fetchPosition(): Promise<ArtemisPosition> {
  const cached = readCache();
  const needsRefresh = !cached || cached.data.stale;

  if (needsRefresh) {
    // Primary: CF Worker (merges DSN 5s + Horizons 5min on the edge)
    try {
      const res = await fetch(API_URL, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data: ArtemisPosition = await res.json();
        writeCache(data);
        return interpolate(data);
      }
    } catch {}

    // Fallback: direct Horizons call
    try {
      const pos = await fetchHorizons();
      writeCache(pos);
      return interpolate(pos);
    } catch {}
  }

  // Interpolate cached data — this is what makes km tick every second
  if (cached) return interpolate(cached.data);

  return {
    distanceEarthKm: 0, distanceMoonKm: EARTH_MOON_DISTANCE_KM,
    velocityKmS: 0, missionElapsedMs: Math.max(0, Date.now() - LAUNCH_TIME.getTime()),
    phase: "earth_orbit", timestamp: new Date().toISOString(),
    crew: CREW, stale: true,
  };
}
