import { describe, expect, it } from "vitest";

import {
  VOX_SPEECH_FIRST_MS,
  VOX_SPEECH_HIT_MS,
  VOX_SPEECH_OPEN_MS,
  VOX_SPEECH_WAVE_MS,
} from "./arenaVoxSpeechEffect.constants";
import { speechWaves } from "./arenaVoxSpeechEffect.utils";

describe("speechWaves", () => {
  it("opens with a full ring around her before the first wave leaves", () => {
    const waves = speechWaves(VOX_SPEECH_FIRST_MS / 2, { distance: 6 });
    expect(waves).toHaveLength(1);
    expect(waves[0]?.spread).toBeGreaterThanOrEqual(Math.PI);
  });

  it("rolls narrower waves toward the target, the last one arriving at the hit", () => {
    const rolling = speechWaves(VOX_SPEECH_HIT_MS - VOX_SPEECH_WAVE_MS, { distance: 6 });
    expect(rolling.filter((wave) => wave.spread < Math.PI).length).toBeGreaterThan(1);
    const before = speechWaves(VOX_SPEECH_HIT_MS - 20, { distance: 6 });
    const farthest = Math.max(...before.map((wave) => wave.radius));
    expect(farthest).toBeGreaterThan(5);
    expect(farthest).toBeLessThan(6.8);
    expect(speechWaves(VOX_SPEECH_OPEN_MS + VOX_SPEECH_HIT_MS, { distance: 6 })).toEqual([]);
  });

  it("never sends a wave with no strength", () => {
    for (let elapsed = 0; elapsed < VOX_SPEECH_HIT_MS; elapsed += 37)
      for (const wave of speechWaves(elapsed, { distance: 4 }))
        expect(wave.strength).toBeGreaterThan(0);
  });
});
