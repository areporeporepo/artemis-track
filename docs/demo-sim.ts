#!/usr/bin/env node
// Simulates the full Artemis II mission fast-forwarded for GIF recording.
// Diamond moves Earth → Moon → Earth with realistic telemetry at each step.

import { renderStatusline } from "../src/statusline.ts";
import type { ArtemisPosition, MissionPhase } from "../src/types.ts";

const EARTH_MOON = 384_400;
const LAUNCH = new Date("2026-04-01T22:35:00Z").getTime();

// Keyframes: [hoursFromLaunch, distEarth, distMoon, velocity, phase, source, perigee?, apogee?, ascending?]
const KEYFRAMES: [number, number, number, number, MissionPhase, string, number?, number?, boolean?][] = [
  [0.1,     400,    384000, 7.80, "earth_orbit",     "DSN Goldstone",  27,  2222, true],
  [0.5,    1200,    383200, 7.90, "earth_orbit",     "DSN Goldstone",  27,  2222, true],
  [1.0,    3500,    380900, 8.10, "earth_orbit",     "DSN Madrid",    185,  2222, true],
  [3.0,   12000,    372400, 3.20, "earth_orbit",     "Horizons",      185,  2222, false],
  [6.0,   35000,    349400, 2.40, "earth_orbit",     "Horizons + DSN Madrid",  185, 71656, true],
  [13.0,  62000,    322400, 1.80, "earth_orbit",     "Horizons",      185, 71656, true],
  [25.0,  80000,    304400, 1.50, "earth_orbit",     "Horizons + DSN Goldstone", 185, 71656, false],
  [25.2,  95000,    289400, 1.60, "transit_to_moon",  "Horizons + DSN Goldstone"],
  [48.0, 155000,    229400, 1.20, "transit_to_moon",  "Horizons"],
  [73.0, 220000,    164400, 1.05, "transit_to_moon",  "Horizons + DSN Canberra"],
  [100.0,305000,     79400, 0.95, "transit_to_moon",  "Horizons"],
  [110.0,345000,     39400, 0.88, "transit_to_moon",  "Horizons + DSN Madrid"],
  [118.0,370000,     14400, 0.82, "lunar_flyby",      "DSN Madrid"],
  [120.5,382000,      2400, 0.78, "lunar_flyby",      "DSN Goldstone"],
  [122.0,378000,      6400, 0.80, "return_to_earth",  "Horizons"],
  [130.0,350000,     34400, 0.85, "return_to_earth",  "Horizons + DSN Canberra"],
  [145.0,290000,     94400, 0.95, "return_to_earth",  "Horizons"],
  [172.0,200000,    184400, 1.10, "return_to_earth",  "Horizons + DSN Madrid"],
  [196.0,120000,    264400, 1.40, "return_to_earth",  "Horizons"],
  [212.0, 55000,    329400, 2.80, "return_to_earth",  "Horizons + DSN Goldstone"],
  [217.0, 12000,    372400, 7.50, "reentry",          "DSN Goldstone"],
  [217.5,  2000,    382400,11.00, "reentry",          "DSN Goldstone"],
  [217.7,     0,    384400, 0.00, "complete",         "SPLASHDOWN"],
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Generate 60 frames across the full mission
const TOTAL_FRAMES = 60;
const frames: ArtemisPosition[] = [];

for (let i = 0; i < TOTAL_FRAMES; i++) {
  const t = i / (TOTAL_FRAMES - 1);
  const missionHour = t * 217.7;

  // Find surrounding keyframes
  let k0 = 0;
  for (let k = 0; k < KEYFRAMES.length - 1; k++) {
    if (KEYFRAMES[k + 1]![0] >= missionHour) { k0 = k; break; }
    k0 = k;
  }
  const k1 = Math.min(k0 + 1, KEYFRAMES.length - 1);
  const [h0, d0, m0, v0, phase0, src0, pe0, ap0, asc0] = KEYFRAMES[k0]!;
  const [h1, d1, m1, v1, , src1, pe1, ap1, asc1] = KEYFRAMES[k1]!;

  const segT = h0 === h1 ? 1 : (missionHour - h0) / (h1 - h0);
  const clamped = Math.max(0, Math.min(1, segT));

  const frame: ArtemisPosition = {
    distanceEarthKm: Math.round(lerp(d0, d1, clamped)),
    distanceMoonKm: Math.round(lerp(m0, m1, clamped)),
    velocityKmS: Math.round(lerp(v0, v1, clamped) * 100) / 100,
    missionElapsedMs: missionHour * 3_600_000,
    phase: phase0,
    timestamp: new Date(LAUNCH + missionHour * 3_600_000).toISOString(),
    crew: ["Wiseman", "Glover", "Koch", "Hansen"],
    source: clamped > 0.5 ? src1 : src0,
  };

  // Add orbital elements for earth_orbit frames
  if (pe0 !== undefined && ap0 !== undefined) {
    frame.perigeeKm = clamped > 0.5 && pe1 !== undefined ? pe1 : pe0;
    frame.apogeeKm = clamped > 0.5 && ap1 !== undefined ? ap1 : ap0;
    frame.ascending = clamped > 0.5 && asc1 !== undefined ? asc1 : (asc0 ?? true);
  }

  frames.push(frame);
}

// Output each frame with carriage return so it overwrites in-place
let i = 0;
const interval = setInterval(() => {
  if (i >= frames.length) {
    clearInterval(interval);
    process.stdout.write("\n");
    process.exit(0);
  }
  const line = renderStatusline(frames[i]!);
  process.stdout.write(`\r\x1b[2K${line}`);
  i++;
}, 180);
