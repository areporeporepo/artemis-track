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

<details open>
<summary><b>① Earthrise — Apollo 8, 1968</b></summary>
<br/>

<p align="center">
  <img src="docs/earthrise_AS08-14-2383.jpg" alt="Earthrise — Apollo 8, December 24, 1968" width="100%"/>
</p>

<sub>Hasselblad 500 EL · 250mm f/5.6 Sonnar · Kodak Ektachrome SO-368 · 70mm film · 4600×4400 (JSC scan) · AS08-14-2383 · William Anders · 1968-12-24 ~16:40 UTC</sub>

</details>

<details>
<summary><b>② To the Moon — Artemis II, Flight Day 4</b></summary>
<br/>

<p align="center">
  <img src="docs/art002e009006-to-the-moon.jpg" alt="The Moon from Orion — Artemis II Flight Day 4, April 4, 2026" width="100%"/>
</p>

<sub>Nikon D5 · 400mm f/4.5-5.6 · 1/640s f/18 ISO 500 · 5568×3712 · <a href="https://www.nasa.gov/image-detail/amf-art002e009006/">art002e009006</a> · 2026-04-04 02:03:18 UTC</sub>

</details>

<details>
<summary><b>③ "Hello, World" — Artemis II, Flight Day 1</b></summary>
<br/>

<p align="center">
  <img src="docs/art002e000192-hello-world.jpg" alt="Earth from Orion — Artemis II, April 2, 2026" width="100%"/>
</p>

<sub>Nikon D5 · 22mm f/4.0 · ¼s ISO 51200 · 5568×3712 · <a href="https://www.nasa.gov/image-article/hello-world/">art002e000192</a> · 2026-04-03 00:27:39 UTC−05</sub>

</details>

<details>
<summary><b>④ Lunar Far Side — Apollo 16, 1972</b></summary>
<br/>

<p align="center">
  <img src="docs/lunar-farside-AS16-M-3021.png" alt="Lunar far side — Apollo 16 Metric Camera, April 1972" width="100%"/>
</p>

<sub>Fairchild Metric Camera · 76.2mm · Type 3400 B&W film · 4048×4048 (ASU scan) · AS16-M-3021 · Apollo 16 trans-Earth coast · 1972-04</sub>

</details>

<details>
<summary><b>⑤ Lunar South Pole — LRO, 2009–2011</b></summary>
<br/>

<p align="center">
  <img src="docs/lunar-south-pole-PIA14024.jpg" alt="Lunar south pole — LRO LROC mosaic" width="100%"/>
</p>

<sub>LROC WAC mosaic · 100 m/pixel · 1242×1242 · PIA14024 · Lunar Reconnaissance Orbiter · Shackleton crater visible at center · 2009–2011</sub>

</details>
