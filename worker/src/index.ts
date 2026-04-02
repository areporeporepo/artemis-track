import { parseOEM, interpolateAt } from "./parser.ts";
import { computePosition, type PositionData } from "./compute.ts";

interface Env {
  ARTEMIS_KV: KVNamespace;
  NIM_API_KEY: string;
}

const EPHEMERIS_URL = "https://www.nasa.gov/wp-content/uploads/2026/04/artemis-ii-ephemeris.txt";
const NASA_BLOG_URL = "https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/";
const NIM_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const CREW = ["Wiseman", "Glover", "Koch", "Hansen"];
const LAUNCH_TIME = new Date("2026-04-01T22:35:00Z");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET",
  "Content-Type": "application/json",
};

// Extract telemetry from NASA blog text using NIM
async function extractTelemetryFromBlog(nimKey: string): Promise<PositionData | null> {
  try {
    const blogRes = await fetch(NASA_BLOG_URL);
    if (!blogRes.ok) return null;
    const html = await blogRes.text();

    // Strip HTML tags, keep text
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 8000);

    const nimRes = await fetch(NIM_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nimKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b",
        messages: [
          {
            role: "user",
            content: `Extract numbers from this NASA text. Return ONLY JSON, no other text.
{"distance_miles":NUMBER_OR_NULL,"speed_mph":NUMBER_OR_NULL,"altitude_miles":NUMBER_OR_NULL}

Text: ${text.slice(0, 4000)}`
          }
        ],
        max_tokens: 100,
        temperature: 0,
      }),
    });

    if (!nimRes.ok) return null;
    const nimData = await nimRes.json() as any;
    const content = nimData.choices?.[0]?.message?.content;
    if (!content) return null;

    // Extract JSON from response (model might wrap it in markdown)
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (!jsonMatch) return null;

    const extracted = JSON.parse(jsonMatch[0]);
    const met = Math.max(0, Date.now() - LAUNCH_TIME.getTime());

    // Convert miles → km, mph → km/s
    const distMiles = extracted.distance_miles ?? extracted.altitude_miles;
    if (distMiles === null || distMiles === undefined) return null;

    const distEarthKm = Math.round(distMiles * 1.60934);
    const distMoonKm = Math.max(0, 384400 - distEarthKm);
    const velocityKmS = extracted.speed_mph ? Math.round((extracted.speed_mph * 1.60934 / 3600) * 100) / 100 : 0;

    let phase = "transit_to_moon";
    if (distEarthKm < 2000) phase = "earth_orbit";
    else if (distMoonKm < 20000) phase = "lunar_flyby";
    else if (distEarthKm > distMoonKm) phase = "return_to_earth";

    return {
      distanceEarthKm,
      distanceMoonKm,
      velocityKmS,
      missionElapsedMs: met,
      phase,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

    if (url.pathname === "/position") {
      const cached = await env.ARTEMIS_KV.get("position", "json") as PositionData | null;
      if (cached) {
        return new Response(JSON.stringify({ ...cached, crew: CREW }), { headers: CORS_HEADERS });
      }
      return new Response(JSON.stringify({
        distanceEarthKm: 0, distanceMoonKm: 384400, velocityKmS: 0,
        missionElapsedMs: Math.max(0, Date.now() - LAUNCH_TIME.getTime()),
        phase: "earth_orbit", timestamp: new Date().toISOString(), crew: CREW, stale: true,
      }), { headers: CORS_HEADERS });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true }), { headers: CORS_HEADERS });
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // Strategy 1: Try NASA OEM ephemeris file (most accurate)
    try {
      const res = await fetch(EPHEMERIS_URL);
      if (res.ok) {
        const text = await res.text();
        const vectors = parseOEM(text);
        if (vectors.length > 0) {
          const current = interpolateAt(vectors, new Date());
          if (current) {
            const position = computePosition(current);
            await env.ARTEMIS_KV.put("position", JSON.stringify(position), { expirationTtl: 600 });
            return; // OEM data is best — done
          }
        }
      }
    } catch {}

    // Strategy 2: Extract telemetry from NASA live blog via NIM
    if (env.NIM_API_KEY) {
      try {
        const position = await extractTelemetryFromBlog(env.NIM_API_KEY);
        if (position) {
          await env.ARTEMIS_KV.put("position", JSON.stringify(position), { expirationTtl: 600 });
          return;
        }
      } catch {}
    }

    // Strategy 3: No data sources available — KV retains last good value
  },
};
