// test/statusline.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderStatusline } from "../src/statusline.ts";
import type { ArtemisPosition } from "../src/types.ts";

const mockPosition: ArtemisPosition = {
  distanceEarthKm: 148302,
  distanceMoonKm: 236098,
  velocityKmS: 2.34,
  missionElapsedMs: 8073000,
  phase: "transit_to_moon",
  timestamp: "2026-04-02T00:49:00Z",
  crew: ["Wiseman", "Glover", "Koch", "Hansen"],
};

describe("statusline renderer", () => {
  it("renders multi-line output", () => {
    const output = renderStatusline(mockPosition, 0);
    const lines = output.split("\n");
    assert.ok(lines.length >= 6, `expected 6+ lines, got ${lines.length}`);
  });
  it("includes distance from Earth", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("148,302"));
  });
  it("includes crew names", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("Wiseman"));
    assert.ok(output.includes("Hansen"));
  });
  it("includes Orion label", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("Orion"));
  });
  it("includes mission elapsed time", () => {
    const output = renderStatusline(mockPosition, 0);
    assert.ok(output.includes("2h 14m"));
  });
  it("shows stale indicator when data is stale", () => {
    const stale = { ...mockPosition, stale: true };
    const output = renderStatusline(stale, 0);
    assert.ok(output.includes("stale") || output.includes("\x1b[2m"));
  });
});
