// test/trajectory.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderTrajectoryBar } from "../src/trajectory.ts";
import type { ArtemisPosition } from "../src/types.ts";

function makePos(overrides: Partial<ArtemisPosition>): ArtemisPosition {
  return {
    distanceEarthKm: 0, distanceMoonKm: 384400, velocityKmS: 1,
    missionElapsedMs: 100 * 3_600_000, phase: "transit_to_moon",
    timestamp: new Date().toISOString(), crew: [],
    ...overrides,
  };
}

describe("trajectory bar", () => {
  it("shows orbit ring during earth orbit", () => {
    const bar = renderTrajectoryBar(makePos({
      distanceEarthKm: 1000, phase: "earth_orbit", missionElapsedMs: 3_600_000,
      perigeeKm: 185, apogeeKm: 2222, ascending: true,
    }));
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    assert.ok(stripped.includes("("), `expected orbit ring, got: ${stripped}`);
    assert.ok(stripped.includes("185"), `expected perigee`);
    assert.ok(stripped.includes("apogee"), `expected direction`);
  });

  it("shows arc with both distances during transit", () => {
    const bar = renderTrajectoryBar(makePos({
      distanceEarthKm: 192200, distanceMoonKm: 192200, phase: "transit_to_moon",
    }));
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    const dotPos = stripped.indexOf("◆");
    assert.ok(dotPos > 5 && dotPos < 30, `dotPos was ${dotPos}`);
    assert.ok(stripped.includes("🌍"), "expected Earth");
  });

  it("shows lunar altitude during flyby", () => {
    const bar = renderTrajectoryBar(makePos({
      distanceEarthKm: 380000, distanceMoonKm: 4400, phase: "lunar_flyby",
    }));
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    assert.ok(stripped.includes("alt"), `expected altitude display, got: ${stripped}`);
  });
});
