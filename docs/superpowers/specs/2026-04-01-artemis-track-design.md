# Artemis Track — Design Spec

## Overview

A real-time Artemis II mission tracker that renders as a Claude Code companion-style ASCII sprite in the status line. Anyone with Claude Code can install it with one config change. The tracker shows Orion's live position, distance from Earth/Moon, velocity, and mission elapsed time.

**Ship date constraint**: Artemis II splashes down April 10, 2026. Must be live ASAP.

## Architecture

Two components:

### 1. Cloudflare Worker (`artemis-api`)

- **Host**: `artemis.aircloudy.co` (Anh's CF account, zone `aircloudy.co`)
- **Runtime**: Cloudflare Workers + KV
- **Data source**: NASA AROW ephemeris file (CCSDS OEM format)
  - Text file with state vectors every 4 minutes
  - Position XYZ + velocity XYZ in J2000 reference frame (km, km/s)
  - Available at NASA's AROW page after mission begins
- **Cron**: Runs every 5 minutes to fetch + parse latest ephemeris
- **KV store**: Caches parsed position data
- **Endpoint**: `GET /position`
  ```json
  {
    "distanceEarthKm": 148302,
    "distanceMoonKm": 236891,
    "velocityKmS": 2.34,
    "missionElapsedMs": 8073000,
    "phase": "transit_to_moon",
    "timestamp": "2026-04-01T23:35:00Z",
    "crew": ["Wiseman", "Glover", "Koch", "Hansen"]
  }
  ```
- **Phases**: `earth_orbit`, `transit_to_moon`, `lunar_flyby`, `return_to_earth`, `reentry`
- **CORS**: `*` (public API)
- **Fallback**: If AROW is unreachable, serve last cached data with `stale: true`

### 2. npm Package (`artemis-track`)

- **Package name**: `artemis-track`
- **Runtime**: Node.js (>=18)
- **Language**: TypeScript, compiled to JS for npm
- **Entry point**: `bin/artemis-track.js`

#### Mode 1: Claude Code Status Line (default)

When stdin is piped (Claude Code pipes JSON), renders companion-style output:

```
╭────────────────────────────────╮
│ 148,302 km from Earth · 2.3 km/s │
│ MET 2h 14m  ·  lunar transit   │
╰────────────────────────────────╯
 ╲
    /\       🌍 ······•·············· 🌑
   /  \
  | ○○ |     Wiseman · Glover · Koch · Hansen
  |_**_|
   ⊿⊿⊿⊿
  Orion
```

**Rendering details**:
- Sprite: 5 lines tall, 12 chars wide, 3 animation frames (thruster flicker)
- Speech bubble: 34 chars wide, rounded border, shows distance + MET + phase
- Trajectory bar: ASCII dots with position marker between Earth/Moon emojis
- Crew names on a separate line
- ANSI colors: cyan for bubble border, yellow for data, dim for trajectory dots
- Animation: frame cycles on each statusline tick (~300ms debounce means ~1-3s per frame)

**Data fetching**:
- Fetches from CF worker on first run
- Caches to `/tmp/artemis-track-cache.json` with 30-second TTL
- If fetch fails, shows cached data with dim styling
- If no cache at all, shows "Acquiring signal..." placeholder

**Claude Code integration**:
```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y artemis-track@latest",
    "padding": 0
  }
}
```

#### Mode 2: Standalone TUI (`--tui` flag)

Full-screen terminal view with larger trajectory visualization:

```
  ╔═══════════════════════════════════════════════════╗
  ║           A R T E M I S   I I   T R A C K E R    ║
  ╚═══════════════════════════════════════════════════╝

   🌍 Earth ·········•························ 🌑 Moon
              ↑ Orion

   Distance from Earth:  148,302 km
   Distance from Moon:   236,891 km
   Velocity:             2.34 km/s
   Mission Elapsed:      2h 14m 33s
   Phase:                Lunar Transit

   Crew: Reid Wiseman (CDR) · Victor Glover (PLT)
         Christina Koch (MS) · Jeremy Hansen (MS)

   Data: NASA AROW · Updated 12s ago
```

Auto-refreshes every 30 seconds. Ctrl+C to quit.

## Sprite Design

ASCII art sprite (5×12 grid, 3 animation frames):

```
Frame 0 (idle):     Frame 1 (thrust):   Frame 2 (boost):
                                          ~ ~
   /\                  /\                  /\
  /  \                /  \                /  \
 | ○○ |              | ●● |              | ○○ |
 |_**_|              |_**_|              |_**_|
  ⊿⊿⊿⊿               ⊿⊿⊿⊿~             ~⊿⊿⊿⊿~
```

- `○○` = windows (idle), `●●` = windows lit (thrust)
- `**` = heat shield texture
- `⊿⊿⊿⊿` = service module thrusters
- `~` = exhaust particles (animated)
- Top line reserved for boost particles in frame 2

## File Structure

```
artemis-track/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Entry: detect mode, dispatch
│   ├── statusline.ts     # Claude Code statusline renderer
│   ├── tui.ts            # Standalone TUI mode
│   ├── api.ts            # Fetch + cache from CF worker
│   ├── sprites.ts        # Orion ASCII sprites + animation
│   ├── trajectory.ts     # ASCII trajectory bar rendering
│   └── types.ts          # Shared types
├── worker/
│   ├── src/
│   │   ├── index.ts      # CF Worker entry
│   │   ├── parser.ts     # OEM ephemeris parser
│   │   └── compute.ts    # Distance/velocity calculations
│   └── wrangler.toml
└── README.md
```

## Distribution

- **npm**: `npm publish` as `artemis-track`
- **GitHub**: `areporeporepo/artemis-track`
- **Install**: `npx -y artemis-track@latest` (one-liner)
- **CF Worker**: deployed to `artemis.aircloudy.co`

## Testing

- Unit tests for OEM parser, distance calculations, sprite rendering
- Mock API responses for statusline rendering tests
- Manual test: `echo '{"model":{"display_name":"Opus"}}' | npx artemis-track`

## Out of Scope

- Lunar landing visualization (Artemis II is flyby only)
- 3D rendering
- Sound/notifications
- Persistent state between sessions
