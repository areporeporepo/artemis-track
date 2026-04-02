/**
 * Artemis II Tracker — Cloudflare Worker
 *
 * Data chain (fastest → most complete):
 *   1. DSN Now XML (5s refresh) — range from ground station
 *   2. JPL Horizons API (~1min) — full state vectors
 *   3. KV cache — last known good
 *
 * Cron: every 1 min (fallback — DO handles primary 1s polling)
 * GET /position — returns latest cached position
 * GET /dsn — returns raw DSN status for EM2
 * GET /health — liveness check
 */

interface Env {
  ARTEMIS_KV: KVNamespace;
  POLLER: DurableObjectNamespace;
}

// ── Durable Object — 1s alarm loop ──────────────────────────────────
// Every tick: Horizons (1s, sequential — under concurrency limit)
// Every 5th tick: DSN (matches NASA's 5s refresh)
export class DsnPoller implements DurableObject {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const alarm = await this.state.storage.getAlarm();
    if (!alarm) {
      await this.state.storage.setAlarm(Date.now() + 1000);
    }
    return new Response(JSON.stringify({ polling: true }));
  }

  async alarm(): Promise<void> {
    let delay = 1000;
    const tick = ((await this.state.storage.get<number>("tick")) ?? 0) + 1;
    await this.state.storage.put("tick", tick);

    try {
      // Horizons every tick (1s) — sequential, stays under concurrency limit
      const horizons = await fetchHorizons();
      if (horizons) {
        const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());
        const pos: Position = {
          distanceEarthKm: horizons.distanceEarthKm,
          distanceMoonKm: horizons.distanceMoonKm,
          velocityKmS: horizons.velocityKmS,
          missionElapsedMs: met,
          phase: detectPhase(met, horizons.distanceEarthKm, horizons.distanceMoonKm),
          timestamp: new Date().toISOString(),
          crew: CREW,
          source: "Horizons",
        };
        await this.env.ARTEMIS_KV.put("position", JSON.stringify(pos), { expirationTtl: 60 });
      }

      // DSN every 5th tick (5s) — matches NASA's exact refresh rate
      if (tick % 5 === 0) {
        const dsn = await fetchDSN();
        if (dsn && dsn.rangeKm > 0) {
          await this.env.ARTEMIS_KV.put("dsn", JSON.stringify({
            ...dsn,
            timestamp: new Date().toISOString(),
          }), { expirationTtl: 30 });
        }
      }

      // Reset fail counter on success
      await this.state.storage.delete("fails");
    } catch {
      const fails = ((await this.state.storage.get<number>("fails")) ?? 0) + 1;
      await this.state.storage.put("fails", fails);
      delay = Math.min(60_000, 1000 * Math.pow(2, fails));
    }

    await this.state.storage.setAlarm(Date.now() + delay);
  }
}

const CREW = ["Wiseman", "Glover", "Koch", "Hansen"];
const LAUNCH_TIME = new Date("2026-04-01T22:35:00Z");
const EARTH_MOON_KM = 384_400;

const DSN_URL = "https://eyes.nasa.gov/dsn/data/dsn.xml";
const HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Content-Type": "application/json",
};

interface Position {
  distanceEarthKm: number;
  distanceMoonKm: number;
  velocityKmS: number;
  missionElapsedMs: number;
  phase: string;
  timestamp: string;
  crew: string[];
  source: string;
  dsn?: { station: string; dish: string; signalDbm: number; dataRateKbps: number };
}

// ── DSN Now — 5-second real-time range ──────────────────────────────

interface DsnTarget {
  rangeKm: number;
  signalDbm: number;
  dataRateKbps: number;
  station: string;
  dish: string;
}

async function fetchDSN(): Promise<DsnTarget | null> {
  const res = await fetch(DSN_URL, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const xml = await res.text();

  // Single-pass line scan tracking current station and dish context
  let currentStation = "";
  let currentDish = "";

  for (const line of xml.split("\n")) {
    if (line.includes('friendlyName="Goldstone"')) currentStation = "Goldstone";
    else if (line.includes('friendlyName="Madrid"')) currentStation = "Madrid";
    else if (line.includes('friendlyName="Canberra"')) currentStation = "Canberra";

    const dishMatch = line.match(/<dish\s+name="([^"]+)"/);
    if (dishMatch) currentDish = dishMatch[1];

    if (!line.includes('name="EM2"') && !line.includes('spacecraft="EM2"')) continue;

    const range = line.match(/downlegRange="(\d+)"/);
    if (!range || parseInt(range[1], 10) === 0) continue;

    const power = line.match(/power="(-?\d+)"/);
    const rate = line.match(/dataRate="(\d+)"/);

    return {
      rangeKm: parseInt(range[1], 10),
      signalDbm: power ? parseInt(power[1], 10) : 0,
      dataRateKbps: rate ? Math.round(parseInt(rate[1], 10) / 1000) : 0,
      station: currentStation,
      dish: currentDish,
    };
  }

  return null;
}

// ── JPL Horizons — full state vectors ───────────────────────────────

interface HorizonsData {
  distanceEarthKm: number;
  distanceMoonKm: number;
  velocityKmS: number;
}

function buildHorizonsQS(command: string, start: Date, stop: Date): string {
  const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
  return [
    "format=json",
    `COMMAND=%27${command}%27`,
    "EPHEM_TYPE=VECTORS",
    "CENTER=%27500%40399%27",
    `START_TIME=%27${encodeURIComponent(fmt(start))}%27`,
    `STOP_TIME=%27${encodeURIComponent(fmt(stop))}%27`,
    "STEP_SIZE=%271%20min%27",
    "VEC_TABLE=%272%27",
  ].join("&");
}

function parseStateVector(result: string): { px: number; py: number; pz: number; vx: number; vy: number; vz: number } | null {
  let inData = false;
  let px = 0, py = 0, pz = 0, vx = 0, vy = 0, vz = 0;
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
  if (px === 0 && py === 0) return null;
  return { px, py, pz, vx, vy, vz };
}

async function fetchHorizons(): Promise<HorizonsData | null> {
  const now = new Date();
  const start = new Date(now.getTime() - 60_000);

  // Query Orion AND Moon in parallel — both geocentric
  const [orionRes, moonRes] = await Promise.all([
    fetch(`${HORIZONS_URL}?${buildHorizonsQS("-1024", start, now)}`, { signal: AbortSignal.timeout(8000) }),
    fetch(`${HORIZONS_URL}?${buildHorizonsQS("301", start, now)}`, { signal: AbortSignal.timeout(8000) }),
  ]);

  if (!orionRes.ok) return null;
  const orionData = (await orionRes.json()) as { result: string; error?: string };
  if (orionData.error) return null;
  const orion = parseStateVector(orionData.result);
  if (!orion) return null;

  const distEarth = Math.sqrt(orion.px ** 2 + orion.py ** 2 + orion.pz ** 2);
  const speed = Math.sqrt(orion.vx ** 2 + orion.vy ** 2 + orion.vz ** 2);

  // Real Moon distance from actual Moon position (not hardcoded 384,400)
  let distMoon = Math.max(0, EARTH_MOON_KM - distEarth); // fallback
  if (moonRes.ok) {
    const moonData = (await moonRes.json()) as { result: string; error?: string };
    if (!moonData.error) {
      const moon = parseStateVector(moonData.result);
      if (moon) {
        distMoon = Math.sqrt(
          (orion.px - moon.px) ** 2 +
          (orion.py - moon.py) ** 2 +
          (orion.pz - moon.pz) ** 2,
        );
      }
    }
  }

  return {
    distanceEarthKm: Math.round(distEarth * 1000) / 1000,
    distanceMoonKm: Math.max(0, Math.round(distMoon * 1000) / 1000),
    velocityKmS: Math.round(speed * 10000) / 10000,
  };
}

// ── Phase detection ─────────────────────────────────────────────────

function detectPhase(met: number, distEarth: number, distMoon: number): string {
  const hours = met / 3_600_000;
  if (hours >= 240) return "complete";
  if (hours >= 230) return "reentry";
  if (distMoon < 20000) return "lunar_flyby";
  if (distEarth > distMoon) return "return_to_earth";
  if (distEarth < 2000) return "earth_orbit";
  return "transit_to_moon";
}

// ── Scheduled cron — polls DSN + Horizons, writes KV ────────────────

async function updatePosition(env: Env): Promise<Position> {
  const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());
  const [dsnResult, horizonsResult] = await Promise.allSettled([
    fetchDSN(),
    fetchHorizons(),
  ]);

  const dsn = dsnResult.status === "fulfilled" ? dsnResult.value : null;
  const horizons = horizonsResult.status === "fulfilled" ? horizonsResult.value : null;

  // Merge: Horizons for position+velocity (sub-km precision), DSN for signal metadata
  let distEarth = 0;
  let distMoon = EARTH_MOON_KM;
  let velocity = 0;
  let source = "none";
  let dsnInfo: Position["dsn"] | undefined;

  if (horizons) {
    distEarth = horizons.distanceEarthKm;
    distMoon = horizons.distanceMoonKm;
    velocity = horizons.velocityKmS;
    source = "Horizons";
  }

  if (dsn && dsn.rangeKm > 0) {
    dsnInfo = {
      station: dsn.station,
      dish: dsn.dish,
      signalDbm: dsn.signalDbm,
      dataRateKbps: dsn.dataRateKbps,
    };
    if (horizons) {
      source = `Horizons + DSN ${dsn.station}`;
    } else {
      // Horizons failed — fall back to DSN coarse range
      distEarth = dsn.rangeKm;
      distMoon = Math.max(0, EARTH_MOON_KM - dsn.rangeKm);
      source = `DSN ${dsn.station} ${dsn.dish}`;
    }
  }

  // Fallback: read last KV value if both failed
  if (!horizons && (!dsn || dsn.rangeKm === 0)) {
    const prev = await env.ARTEMIS_KV.get("position", "json") as Position | null;
    if (prev) { distEarth = prev.distanceEarthKm; distMoon = prev.distanceMoonKm; velocity = prev.velocityKmS; }
  }

  const position: Position = {
    distanceEarthKm: distEarth,
    distanceMoonKm: distMoon,
    velocityKmS: velocity,
    missionElapsedMs: met,
    phase: detectPhase(met, distEarth, distMoon),
    timestamp: new Date().toISOString(),
    crew: CREW,
    source,
    dsn: dsnInfo,
  };

  await env.ARTEMIS_KV.put("position", JSON.stringify(position), { expirationTtl: 600 });
  return position;
}

// ── Worker ──────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/position") {
      // Merge: 5s DSN from DO + 5min Horizons from cron
      const [dsnRaw, posRaw] = await Promise.all([
        env.ARTEMIS_KV.get("dsn", "json") as Promise<(DsnTarget & { timestamp: string }) | null>,
        env.ARTEMIS_KV.get("position", "json") as Promise<Position | null>,
      ]);

      let pos = posRaw;
      if (!pos) pos = await updatePosition(env);

      // Ensure DO poller is running (idempotent — only sets alarm if none exists)
      const pollerId = env.POLLER.idFromName("artemis2");
      if (!posRaw) env.POLLER.get(pollerId).fetch(new Request("https://internal/start")).catch(() => {});

      // Override with fresher DSN range
      if (dsnRaw && dsnRaw.rangeKm > 0) {
        pos = {
          ...pos!,
          distanceEarthKm: dsnRaw.rangeKm,
          distanceMoonKm: Math.max(0, EARTH_MOON_KM - dsnRaw.rangeKm),
          source: `DSN ${dsnRaw.station} ${dsnRaw.dish} + Horizons`,
          dsn: {
            station: dsnRaw.station,
            dish: dsnRaw.dish,
            signalDbm: dsnRaw.signalDbm,
            dataRateKbps: dsnRaw.dataRateKbps,
          },
          timestamp: dsnRaw.timestamp,
        };
      }

      return new Response(JSON.stringify(pos), { headers: CORS });
    }

    if (url.pathname === "/dsn") {
      const dsn = await fetchDSN();
      return new Response(JSON.stringify(dsn ?? { error: "EM2 not in DSN feed" }), { headers: CORS });
    }

    if (url.pathname === "/refresh") {
      const pos = await updatePosition(env);
      return new Response(JSON.stringify(pos), { headers: CORS });
    }

    if (url.pathname === "/start-poller") {
      const id = env.POLLER.idFromName("artemis2");
      const stub = env.POLLER.get(id);
      const res = await stub.fetch(new Request("https://internal/start"));
      return new Response(await res.text(), { headers: CORS });
    }

    if (url.pathname === "/health") {
      const pos = await env.ARTEMIS_KV.get("position", "json") as Position | null;
      return new Response(JSON.stringify({
        ok: true,
        lastUpdate: pos?.timestamp ?? null,
        source: pos?.source ?? null,
      }), { headers: CORS });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await updatePosition(env);
  },
};
