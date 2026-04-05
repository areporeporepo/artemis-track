## orion-status

Real-time Artemis II tracker for your terminal.

<p align="center">
  <img src="earthrise.gif" alt="Earthrise — JAXA Kaguya HDTV, April 2008" width="100%"/>
</p>

<sub>JAXA/NHK Kaguya (SELENE) HDTV — real Earthrise from lunar orbit, April 2008</sub>

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
  <img src="docs/gallery-slideshow.svg" alt="Photo gallery — crossfade slideshow with metadata" width="100%"/>
</p>

---

> **Gallery filter:** All images below are rendered with an infrared red tint (channel-shift: R×1.4, G×0.55, B×0.45) inspired by JWST/Spitzer false-color infrared imaging. This is an artistic filter, not scientific data. See [`docs/image-filter.json`](docs/image-filter.json) for full metadata.

<details>
<summary><b>① Earthrise — Apollo 8</b></summary>
<br/>

<p align="center">
  <img src="docs/earthrise_AS08-14-2383.jpg" alt="Earthrise — Apollo 8, December 24, 1968" width="100%"/>
</p>

<sub>Hasselblad 500 EL · 250mm f/5.6 Sonnar · Kodak Ektachrome SO-368 · 70mm film · 4600×4400 (JSC scan) · AS08-14-2383 · William Anders · 1968-12-24 ~16:40 UTC · <b>infrared-red-tint filter</b></sub>

</details>

<details>
<summary><b>② Orion — The Moon</b></summary>
<br/>

<p align="center">
  <img src="docs/art002e009006-to-the-moon.jpg" alt="The Moon from Orion — Artemis II Flight Day 4, April 4, 2026" width="100%"/>
</p>

<sub>Nikon D5 · 400mm f/4.5-5.6 · 1/640s f/18 ISO 500 · 5568×3712 · <a href="https://www.nasa.gov/image-detail/amf-art002e009006/">art002e009006</a> · 2026-04-04 02:03:18 UTC · <b>infrared-red-tint filter</b></sub>

</details>

<details>
<summary><b>③ Orion — Earth</b></summary>
<br/>

<p align="center">
  <img src="docs/art002e000192-hello-world.jpg" alt="Earth from Orion — Artemis II, April 2, 2026" width="100%"/>
</p>

<sub>Nikon D5 · 22mm f/4.0 · ¼s ISO 51200 · 5568×3712 · <a href="https://www.nasa.gov/image-article/hello-world/">art002e000192</a> · 2026-04-03 00:27:39 UTC−05 · <b>infrared-red-tint filter</b></sub>

</details>

<details>
<summary><b>④ Apollo 16 — Lunar Far Side</b></summary>
<br/>

<p align="center">
  <img src="docs/lunar-farside-AS16-M-3021.png" alt="Lunar far side — Apollo 16 Metric Camera, April 1972" width="100%"/>
</p>

<sub>Fairchild Metric Camera · 76.2mm · Type 3400 B&W film · 4048×4048 (ASU scan) · AS16-M-3021 · Apollo 16 trans-Earth coast · 1972-04 · <b>infrared-red-tint filter</b></sub>

</details>

<details>
<summary><b>⑤ LRO — Lunar South Pole</b></summary>
<br/>

<p align="center">
  <img src="docs/lunar-south-pole-PIA14024.jpg" alt="Lunar south pole — LRO LROC mosaic" width="100%"/>
</p>

<sub>LROC WAC mosaic · 100 m/pixel · 1242×1242 · PIA14024 · Lunar Reconnaissance Orbiter · Shackleton crater visible at center · 2009–2011 · <b>infrared-red-tint filter</b></sub>

</details>
