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

// Earth's gravitational parameter (km^3/s^2)
const MU_EARTH = 398_600.4418;
const EARTH_RADIUS_KM = 6_371.0;

function computeOrbitalElements(o: { px: number; py: number; pz: number; vx: number; vy: number; vz: number }) {
  const r = Math.sqrt(o.px ** 2 + o.py ** 2 + o.pz ** 2);
  const v = Math.sqrt(o.vx ** 2 + o.vy ** 2 + o.vz ** 2);

  // Specific orbital energy → semi-major axis
  const epsilon = (v ** 2) / 2 - MU_EARTH / r;
  if (epsilon >= 0) return null; // hyperbolic/escape — no closed orbit
  const a = -MU_EARTH / (2 * epsilon);

  // Eccentricity vector
  // e_vec = (v × h) / mu - r_hat
  const hx = o.py * o.vz - o.pz * o.vy;
  const hy = o.pz * o.vx - o.px * o.vz;
  const hz = o.px * o.vy - o.py * o.vx;
  const ex = (o.vy * hz - o.vz * hy) / MU_EARTH - o.px / r;
  const ey = (o.vz * hx - o.vx * hz) / MU_EARTH - o.py / r;
  const ez = (o.vx * hy - o.vy * hx) / MU_EARTH - o.pz / r;
  const e = Math.sqrt(ex ** 2 + ey ** 2 + ez ** 2);

  const perigeeKm = Math.round(a * (1 - e) - EARTH_RADIUS_KM);
  const apogeeKm = Math.round(a * (1 + e) - EARTH_RADIUS_KM);

  // Ascending = radial velocity positive (moving away from Earth)
  const rdot = (o.px * o.vx + o.py * o.vy + o.pz * o.vz) / r;
  const ascending = rdot > 0;

  return { perigeeKm, apogeeKm, ascending };
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

  // TLI burn at T+25.13h is the real boundary between earth orbit and transit
  const TLI_MS = 25.13 * 3_600_000;
  const phase: MissionPhase = met >= 240 * 3_600_000 ? "complete"
    : met >= 230 * 3_600_000 ? "reentry"
    : distMoon < 20000 ? "lunar_flyby"
    : distEarth > distMoon ? "return_to_earth"
    : met < TLI_MS ? "earth_orbit"
    : "transit_to_moon";

  // Compute orbital elements from state vectors
  const orbit = computeOrbitalElements(o);

  return {
    distanceEarthKm: Math.round(distEarth),
    distanceMoonKm: Math.round(distMoon),
    velocityKmS: Math.round(speed * 100) / 100,
    missionElapsedMs: met,
    phase,
    timestamp: now.toISOString(),
    crew: CREW,
    ...(orbit && { perigeeKm: orbit.perigeeKm, apogeeKm: orbit.apogeeKm, ascending: orbit.ascending }),
  };
}

// Interpolate distance using velocity between data points
// So the km counter ticks every render, not every 5s
const LAUNCH_EPOCH = LAUNCH_TIME.getTime();

// No monotonic locking — interpolation is smooth because we hold cache
// long enough that we don't re-fetch mid-interpolation cycle

// Recalculate phase from MET + distances — overrides server-side phase
// TLI burn at T+25.13h is the definitive earth-orbit → transit boundary
const TLI_MS = 25.13 * 3_600_000;

function recalcPhase(met: number, distEarth: number, distMoon: number): MissionPhase {
  if (met >= 240 * 3_600_000) return "complete";
  if (met >= 230 * 3_600_000) return "reentry";
  if (distMoon < 20000) return "lunar_flyby";
  if (distEarth > distMoon) return "return_to_earth";
  if (met < TLI_MS) return "earth_orbit";
  return "transit_to_moon";
}

// Known Artemis II orbit profile — perigee×apogee changes at each burn
// Burns happen at specific times, orbit is stable between burns
const ORBIT_PROFILE: { afterHours: number; perigee: number; apogee: number }[] = [
  { afterHours: 0,     perigee: 27,    apogee: 2_222 },   // post-launch suborbital
  { afterHours: 0.83,  perigee: 185,   apogee: 2_222 },   // after perigee raise burn
  { afterHours: 1.8,   perigee: 185,   apogee: 71_656 },  // after apogee raise → 24h HEO
];

function getOrbitProfile(met: number): { perigeeKm: number; apogeeKm: number } {
  const hours = met / 3_600_000;
  let orbit = ORBIT_PROFILE[0]!;
  for (const o of ORBIT_PROFILE) {
    if (hours >= o.afterHours) orbit = o;
  }
  return { perigeeKm: orbit.perigee, apogeeKm: orbit.apogee };
}

// Determine ascending/descending from vis-viva:
// if current altitude > midpoint of perigee and apogee, and slowing down → near apogee → about to descend
// simpler: use altitude relative to semi-major axis
function isAscending(distEarthKm: number, velocityKmS: number, perigeeKm: number, apogeeKm: number): boolean {
  const r = distEarthKm + EARTH_RADIUS_KM;
  const a = (perigeeKm + apogeeKm) / 2 + EARTH_RADIUS_KM; // semi-major axis
  // At perigee: v is max, r is min → ascending after perigee
  // At apogee: v is min, r is max → descending after apogee
  // Use radial velocity sign: positive = moving away = ascending
  // Approximate: v² = mu*(2/r - 1/a), at perigee v > v_circular, at apogee v < v_circular
  const vCircular = Math.sqrt(MU_EARTH / r);
  // Above semi-major axis altitude + faster than circular → still climbing past apogee (unlikely)
  // Below semi-major axis altitude → could be ascending or descending
  // Simplest heuristic: if alt < midpoint, ascending if v > v_circular
  const alt = distEarthKm;
  const midAlt = (perigeeKm + apogeeKm) / 2;
  if (alt < midAlt) {
    return velocityKmS > vCircular; // near perigee, fast = just passed perigee = ascending
  }
  return velocityKmS > vCircular * 0.9; // near apogee, slower
}

function interpolate(data: ArtemisPosition): ArtemisPosition {
  const now = Date.now();
  const met = Math.max(0, now - LAUNCH_EPOCH);
  const phase = recalcPhase(met, data.distanceEarthKm, data.distanceMoonKm);

  // Compute orbital elements for earth orbit phase
  let perigeeKm = data.perigeeKm;
  let apogeeKm = data.apogeeKm;
  let ascending = data.ascending;

  if (phase === "earth_orbit") {
    if (perigeeKm === undefined || apogeeKm === undefined) {
      const orbit = getOrbitProfile(met);
      perigeeKm = orbit.perigeeKm;
      apogeeKm = orbit.apogeeKm;
    }
    if (ascending === undefined) {
      ascending = isAscending(data.distanceEarthKm, data.velocityKmS, perigeeKm!, apogeeKm!);
    }
  }

  if (data.velocityKmS === 0) return { ...data, phase, missionElapsedMs: met, perigeeKm, apogeeKm, ascending };

  // Only interpolate distance during phases with clear radial direction
  if (phase === "earth_orbit" || phase === "lunar_flyby") {
    return { ...data, phase, missionElapsedMs: met, perigeeKm, apogeeKm, ascending };
  }

  const dataAge = (now - new Date(data.timestamp).getTime()) / 1000;
  if (dataAge <= 0) return { ...data, phase, missionElapsedMs: met };

  const dt = Math.min(dataAge, 600);
  const dKm = data.velocityKmS * dt;

  const outbound = phase === "transit_to_moon";
  const sign = outbound ? 1 : -1;

  const earthKm = Math.max(0, Math.round(data.distanceEarthKm + sign * dKm));
  const moonKm = Math.max(0, Math.round(data.distanceMoonKm - sign * dKm));

  return { ...data, phase, distanceEarthKm: earthKm, distanceMoonKm: moonKm, missionElapsedMs: met };
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
