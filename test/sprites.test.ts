// test/sprites.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getSpriteFrame, SPRITE_FRAMES } from "../src/sprites.ts";

describe("sprites", () => {
  it("has 3 frames", () => {
    assert.equal(SPRITE_FRAMES.length, 3);
  });

  it("each frame has 5 or 6 lines", () => {
    for (const frame of SPRITE_FRAMES) {
      assert.ok(frame.length >= 5 && frame.length <= 6);
    }
  });

  it("getSpriteFrame cycles through idle sequence", () => {
    const f0 = getSpriteFrame(0);
    const f1 = getSpriteFrame(4);
    assert.notEqual(f0, f1);
  });

  it("getSpriteFrame returns string with Orion label", () => {
    const frame = getSpriteFrame(0);
    assert.ok(frame.includes("Orion"));
  });
});
