<p align="center">
  <img src="docs/art002e000192-hello-world.jpg" alt="Hello, World — Earth photographed from Orion by Reid Wiseman during Artemis II, April 2, 2026" width="100%"/>
</p>
<p align="center"><i> $100b picture </i></p>

<p align="center">
  <b>"Hello, World"</b> — NASA astronaut Reid Wiseman, Artemis II Commander<br/>
  April 2, 2026 · Orion spacecraft, post-TLI burn · Two auroras, zodiacal light, Earth eclipsing the Sun
</p>

---

## The $100 Billion Picture

This single frame defends the entire Artemis program investment. One photo that makes every constituent say *"we should keep doing this"* — worth every dollar of the ~$93B spent through 2025.

### EXIF Metadata

| Field | Value |
|-------|-------|
| Camera | Nikon D5 (serial: 3500017) |
| Lens | 14–24mm f/2.8 (shot at 22mm) |
| Exposure | ¼ sec · f/4.0 · ISO 51200 |
| Mode | Manual, +1.0 EV bias |
| Shot | 2026-04-03 00:27:39 UTC−05:00 |
| Edited | 2026-04-03 06:54:26 (Lightroom Classic 15.2.1, Windows) |
| Uploaded | 2026-04-03 13:26:26 GMT |
| Resolution | 5568 × 3712 |
| NASA Catalog | art002e000192 |
| PAO Slug | FD02_for_pao (Flight Day 2, Public Affairs Office) |

### NASA Budget — USAspending.gov API

> Source: `GET https://api.usaspending.gov/api/v2/agency/080/budgetary_resources/`

| Fiscal Year | Budget Authority | Obligated | Outlayed |
|:-----------:|:----------------:|:---------:|:--------:|
| 2026 | $43.3B | $8.6B* | $11.1B* |
| 2025 | $41.5B | $28.8B | $26.8B |
| 2024 | $30.1B | $27.2B | $27.1B |
| 2023 | $30.9B | $28.3B | $27.3B |
| 2022 | $29.2B | $26.6B | $25.1B |
| 2021 | $27.9B | $25.2B | $24.3B |
| 2020 | $27.7B | $25.3B | $23.8B |
| 2019 | $26.4B | $24.0B | $22.5B |
| 2018 | $25.4B | $23.4B | $22.5B |
| 2017 | $24.1B | $22.7B | $21.5B |

*\*FY2026 in progress (Q2)*

### Artemis Program Cost

- **$93B** through 2025 (NASA OIG estimate)
- **~$4.1B per launch** (SLS + Orion operating cost, NASA OIG)
- **$7B** in cost overruns across three Artemis projects (GAO-25-107591)

### FY2026–2027 Budget Battle

| | Amount | Status |
|---|--------|--------|
| FY2026 enacted | **$24.4B** | Congress rejected White House cuts |
| FY2027 White House request | **$18.8B** | −23% cut proposed April 3, 2026 |
| FY2027 Senate authorization | **$25.3B** | Senate Commerce Committee (unanimous) |
| Artemis FY2027 request | **$8.5B** | +10% increase (exploration fully funded) |

The White House proposed cutting NASA 23% while increasing Artemis exploration by 10%. Congress has historically rejected these cuts. The Earth photos from Artemis are why — every constituent who sees them says *keep going*.

### Prediction Markets — Real-Time Swing Signal

> No active NASA FY2027 or Oct 2026 shutdown markets yet (too early — markets form ~2-4 weeks before deadlines). Monitor these endpoints for when they appear:

| Platform | API | What to Watch | Auth |
|----------|-----|---------------|------|
| **Polymarket** | `gamma-api.polymarket.com/events?_q=shutdown` | Shutdown probability, duration bets | None |
| **Polymarket WS** | `clob.polymarket.com` WebSocket | Real-time price moves during floor votes | None (read) |
| **Kalshi** | `api.elections.kalshi.com/trade-api/v2/events` | `KXGOVSHUT` series, debt ceiling, spending cuts | RSA key |

**Active Kalshi markets now**: "Will Trump balance the budget?" · "How much spending will Trump cut?" · "Peak US National Debt"

**Why prediction markets > polls**: Markets price in insider knowledge (staffers, lobbyists trade). When a shutdown market spikes from 30%→70% overnight, someone knows something. The Jan 2026 shutdown hit 94% on Kalshi days before it happened.

### Congressional Status

```
 RECESS         House out until Apr 13 · Senate in session
 NEXT HEARING   TBD — NASA Admin Isaacman expected before CJS subcommittees (Apr–May)
 NEXT MARKUP    CJS appropriations subcommittee markup (est. May–Jul 2026)
 NEXT VOTE      No NASA floor vote scheduled · FY2027 deadline: Oct 1, 2026
 DEBT CEILING   New X-date est. fall 2026 (OBBBA raised $4T, burning fast)
 SWING SIGNAL   FY2026 passed 397-28 (H) / 82-15 (S) · only 28 House NO votes
                Watch CJS subcommittee chair + members w/ NASA centers in district
```

**Tracking APIs**: [Congress.gov v3](https://api.congress.gov) (bills/votes) · [Senate schedule](https://www.senate.gov/legislative/2026_schedule.htm) · [House calendar](https://pressgallery.house.gov/schedules/2026-house-calendar) · [OpenFEC](https://api.open.fec.gov) (campaign $) · [Voteview](https://voteview.com/data) (ideology scores) · [OpenOMB](https://openomb.org) (apportionments) · [WhoBoughtMyRep](https://whoboughtmyrep.com/developers) (money→votes, free)

### Data Sources

- Image: [nasa.gov/image-detail/fd02_for-pao](https://www.nasa.gov/image-detail/fd02_for-pao/)
- Budget: [USAspending.gov API](https://api.usaspending.gov/api/v2/agency/080/budgetary_resources/)
- Artemis costs: [GAO-25-107591](https://www.gao.gov/products/gao-25-107591)
- FY2027 request: [SpaceNews](https://spacenews.com/white-house-again-proposes-steep-nasa-budget-cuts/)

---

## DSCOVR EPIC — Earth from L1

<p align="center">
  <img src="docs/epic-earth-20260325.png" alt="Earth from DSCOVR EPIC, March 25, 2026 — Americas visible" width="60%"/>
</p>

<p align="center">
  <sub>DSCOVR/EPIC · 2026-03-25 18:13:24 UTC · 6.92°N 96.59°W · 1.58M km from Earth · id <code>20260325181812</code><br/>
  source: <a href="https://epic.gsfc.nasa.gov/api/natural/date/2026-03-25">epic.gsfc.nasa.gov/api/natural</a> · DSCOVR J2000 x=1566957 y=21236 z=186509 km</sub>
</p>

---

## orion-status

Real-time Artemis II tracker for your terminal.

<p align="center">
  <img src="docs/demo.gif" alt="orion-status live demo" width="100%"/>
</p>

### Install

```bash
npm i -g orion-status
```

### Architecture

```
NASA DSN XML ──> CF Durable Object (1s alarm) ──> KV ──> GET /position
JPL Horizons  ──> CF Cron (1s)                 ──> KV ──/
                                                        |
                                              Client (interpolation)
                                                        |
                                              Terminal status line
```

### License

MIT
