export interface ArtemisPosition {
  distanceEarthKm: number;
  distanceMoonKm: number;
  velocityKmS: number;
  missionElapsedMs: number;
  phase: MissionPhase;
  timestamp: string;
  crew: string[];
  stale?: boolean;
  source?: string;
}

export type MissionPhase =
  | "earth_orbit"
  | "transit_to_moon"
  | "lunar_flyby"
  | "return_to_earth"
  | "reentry"
  | "complete";

export interface CachedData {
  data: ArtemisPosition;
  fetchedAt: number;
}

export const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  orange: "\x1b[38;5;208m",
  gold: "\x1b[38;5;178m",
  blue: "\x1b[38;5;75m",
  silver: "\x1b[38;5;245m",
} as const;

export const API_URL = "https://artemis-api.testa.workers.dev/position";
// CF Worker handles DSN (5s DO alarm) + Horizons (5min cron) merging
export const CACHE_PATH = "/tmp/orion-status-cache.json";
export const CACHE_TTL_MS = 3_000; // 3s — server updates every 1s, client re-fetches often

export const LAUNCH_TIME = new Date("2026-04-01T22:35:00Z");
export const EARTH_MOON_DISTANCE_KM = 384_400;
