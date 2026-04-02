import { type ArtemisPosition, type MissionPhase, C, LAUNCH_TIME } from "./types.ts";
import { formatDistance, formatMET } from "./api.ts";
import { renderTrajectoryBar } from "./trajectory.ts";

const PHASE_LABELS: Record<MissionPhase, string> = {
  earth_orbit: "orbit",
  transit_to_moon: "transit",
  lunar_flyby: "flyby",
  return_to_earth: "return",
  reentry: "reentry",
  complete: "splashdown",
};

// Mission milestones from JPL Horizons (exact times relative to launch)
// Launch: 2026-04-01 22:35:12 UTC
const MILESTONES = [
  { name: "solar array deploy", hoursFromLaunch: 0.33 },
  { name: "perigee raise burn", hoursFromLaunch: 0.83 },
  { name: "apogee raise burn", hoursFromLaunch: 1.8 },
  { name: "ICPS separation", hoursFromLaunch: 3.4 },
  { name: "upper stage sep burn", hoursFromLaunch: 4.83 },
  { name: "perigee raise burn", hoursFromLaunch: 13.48 },
  { name: "TLI burn 🔥", hoursFromLaunch: 25.13 },
  { name: "trajectory correction #1", hoursFromLaunch: 48.13 },
  { name: "trajectory correction #2", hoursFromLaunch: 73.13 },
  { name: "trajectory correction #3", hoursFromLaunch: 100.48 },
  { name: "lunar sphere entry", hoursFromLaunch: 102.13 },
  { name: "closest lunar approach 🌑", hoursFromLaunch: 120.52 },
  { name: "lunar sphere exit", hoursFromLaunch: 138.87 },
  { name: "return correction #1", hoursFromLaunch: 145.48 },
  { name: "manual piloting demo 🎮", hoursFromLaunch: 172.33 },
  { name: "return correction #2", hoursFromLaunch: 196.48 },
  { name: "return correction #3", hoursFromLaunch: 212.48 },
  { name: "CM/SM separation", hoursFromLaunch: 217.15 },
  { name: "entry interface Mach 32 🔥", hoursFromLaunch: 217.48 },
  { name: "drogue chute deploy", hoursFromLaunch: 217.65 },
  { name: "main chutes deploy 🪂", hoursFromLaunch: 217.68 },
  { name: "SPLASHDOWN 🌊", hoursFromLaunch: 217.7 },
];


function getNextMilestone(missionElapsedMs: number): string {
  const hoursElapsed = missionElapsedMs / 3_600_000;
  for (const m of MILESTONES) {
    if (m.hoursFromLaunch > hoursElapsed) {
      const hoursUntil = m.hoursFromLaunch - hoursElapsed;
      if (hoursUntil < 1 / 60) {
        const secs = Math.round(hoursUntil * 3600);
        return `${m.name} in ${secs}s`;
      }
      if (hoursUntil < 1) {
        const mins = Math.round(hoursUntil * 60);
        return `${m.name} in ${mins}m`;
      }
      if (hoursUntil < 24) {
        const h = Math.floor(hoursUntil);
        const mins = Math.round((hoursUntil - h) * 60);
        return `${m.name} in ${h}h${mins > 0 ? ` ${mins}m` : ""}`;
      }
      const days = Math.floor(hoursUntil / 24);
      const h = Math.round(hoursUntil % 24);
      return `${m.name} in ${days}d ${h}h`;
    }
  }
  return "mission complete 🎉";
}

export function renderStatusline(pos: ArtemisPosition): string {
  // Show sub-km precision when interpolating — makes the counter tick visibly
  const dist = pos.distanceEarthKm >= 1000
    ? formatDistance(pos.distanceEarthKm)
    : pos.distanceEarthKm.toFixed(1);
  const vel = pos.velocityKmS.toFixed(2);
  const met = formatMET(pos.missionElapsedMs);
  const phase = PHASE_LABELS[pos.phase] ?? pos.phase;
  const stale = pos.stale ? `${C.dim} ~${C.reset}` : "";
  const next = getNextMilestone(pos.missionElapsedMs);
  const trajectory = renderTrajectoryBar(pos.distanceEarthKm, pos.distanceMoonKm);

  const src = pos.source ? ` ${C.dim}${pos.source}${C.reset}` : "";
  return `${C.gold}🚀 ${dist}km${C.reset} ${C.cyan}${vel}km/s${C.reset} ${C.gray}MET ${met}${C.reset} ${C.green}${phase}${C.reset} ${C.yellow}▸${next}${C.reset}${stale}${src} ${trajectory}`;
}
