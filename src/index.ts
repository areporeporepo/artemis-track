#!/usr/bin/env node
// src/index.ts

import { fetchPosition } from "./api.ts";
import { renderStatusline } from "./statusline.ts";

// Statusline mode: consume stdin (Claude Code JSON), fetch data, render
let stdin = "";
process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk: string) => {
  stdin += chunk;
});
process.stdin.on("end", async () => {
  const pos = await fetchPosition();
  const output = renderStatusline(pos);
  process.stdout.write(output + "\n");
});
