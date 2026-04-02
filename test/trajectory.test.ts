// test/trajectory.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderTrajectoryBar } from "../src/trajectory.ts";

describe("trajectory bar", () => {
  it("shows position marker near Earth when distance is small", () => {
    const bar = renderTrajectoryBar(1000, 383400);
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    const dotPos = stripped.indexOf("◆");
    const earthPos = stripped.indexOf("🌍");
    assert.ok(dotPos - earthPos < 8, `dot at ${dotPos}, earth at ${earthPos}`);
  });

  it("shows position marker near Moon during flyby", () => {
    const bar = renderTrajectoryBar(380000, 4400);
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    const dotPos = stripped.indexOf("◆");
    const moonPos = stripped.indexOf("🌑") >= 0 ? stripped.indexOf("🌑") : stripped.indexOf("🌘");
    assert.ok(moonPos - dotPos < 8, `dot at ${dotPos}, moon at ${moonPos}`);
  });

  it("shows position marker in middle during transit", () => {
    const bar = renderTrajectoryBar(192200, 192200);
    const stripped = bar.replace(/\x1b\[[0-9;]*m/g, "");
    const dotPos = stripped.indexOf("◆");
    assert.ok(dotPos > 5 && dotPos < 30, `dotPos was ${dotPos}`);
  });
});
