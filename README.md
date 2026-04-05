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

---

<p align="center">
  <img src="docs/art002e009006-to-the-moon.jpg" alt="The Moon from Orion — Artemis II Flight Day 4, April 4, 2026" width="100%"/>
</p>

<sub>Nikon D5 · 400mm f/4.5-5.6 · 1/640s f/18 ISO 500 · 5568×3712 · <a href="https://www.nasa.gov/image-detail/amf-art002e009006/">art002e009006</a> · 2026-04-04 02:03:18 UTC</sub>

---

<p align="center">
  <img src="docs/art002e000192-hello-world.jpg" alt="Earth from Orion — Artemis II, April 2, 2026" width="100%"/>
</p>

<sub>Nikon D5 · 22mm f/4.0 · ¼s ISO 51200 · 5568×3712 · <a href="https://www.nasa.gov/image-article/hello-world/">art002e000192</a> · 2026-04-03 00:27:39 UTC−05</sub>

---

<p align="center">
  <img src="docs/earthrise_AS08-14-2383.jpg" alt="Earthrise — Earth rising over the lunar horizon, photographed from Apollo 8 by William Anders, December 24, 1968" width="100%"/>
</p>
<p align="center"><i> the picture that changed how we see ourselves </i></p>

<p align="center">
  <b>"Earthrise"</b> — NASA astronaut William Anders, Apollo 8 Lunar Module Pilot<br/>
  December 24, 1968 · Apollo 8 Command Module, lunar orbit · Earth rising over the lunar horizon
</p>

<sub>Hasselblad 500 EL · 250mm f/5.6 Sonnar · Kodak Ektachrome SO-368 · 70mm film · 4600×4400 (JSC scan) · AS08-14-2383 · 1968-12-24 ~16:40 UTC</sub>
