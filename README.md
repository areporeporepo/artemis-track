<p align="center">
  <img src="docs/art002e000192-hello-world.jpg" alt="Hello, World — Earth photographed from Orion by Reid Wiseman during Artemis II, April 2, 2026" width="100%"/>
</p>
<p align="center"><i> $100b picture </i></p>

<p align="center">
  <b>"Hello, World"</b> — NASA astronaut Reid Wiseman, Artemis II Commander<br/>
  April 2, 2026 · Orion spacecraft, post-TLI burn · Two auroras, zodiacal light, Earth eclipsing the Sun
</p>

<sub>Nikon D5 · 22mm f/4.0 · ¼s ISO 51200 · 5568×3712 · art002e000192 · 2026-04-03 00:27:39 UTC−05</sub>

---

<p align="center">
  <img src="docs/art002e009006-to-the-moon.jpg" alt="The Moon photographed from Orion on Artemis II Flight Day 4, showing Orientale basin — April 4, 2026" width="100%"/>
</p>

<p align="center">
  <b>"To the Moon"</b> — Artemis II crew, Flight Day 4<br/>
  April 4, 2026 · South Pole at top · Orientale basin visible on right edge — first time humans have seen the entire basin
</p>

<sub>Nikon D5 · 400mm f/4.5-5.6 · 1/640s f/18 ISO 500 · 5568×3712 · <a href="https://www.nasa.gov/image-detail/amf-art002e009006/">art002e009006</a> · 2026-04-04 02:03:18 UTC</sub>

---

<p align="center">
  <img src="docs/epic-earth-20260325.png" alt="Earth from DSCOVR EPIC, March 25, 2026" width="60%"/>
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

```bash
npm i -g orion-status
```

```
NASA DSN XML ──> CF Durable Object (1s alarm) ──> KV ──> GET /position
JPL Horizons  ──> CF Cron (1s)                 ──> KV ──/
                                                        |
                                              Client (interpolation)
                                                        |
                                              Terminal status line
```

MIT
