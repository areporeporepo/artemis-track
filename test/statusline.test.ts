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
  it("renders single line", () => {
    const output = renderStatusline(mockPosition);
    const lines = output.split("\n");
    assert.equal(lines.length, 1);
  });
  it("includes distance from Earth", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("148,302"));
  });
  it("includes Orion rocket emoji", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("🚀"));
  });
  it("includes mission elapsed time", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("2h 14m"));
  });
  it("includes trajectory bar with Earth and Moon", () => {
    const output = renderStatusline(mockPosition);
    assert.ok(output.includes("🌍"));
    const moonEmojis = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    assert.ok(moonEmojis.some(e => output.includes(e)));
  });
  it("shows stale indicator when data is stale", () => {
    const stale = { ...mockPosition, stale: true };
    const output = renderStatusline(stale);
    assert.ok(output.includes("~"));
  });
});
