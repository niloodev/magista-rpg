import type { ISoundWave } from "@/modules/arena/services/arenaSoundWave";

import {
  VOX_SPEECH_FIRST_MS,
  VOX_SPEECH_HIT_MS,
  VOX_SPEECH_OPEN_MS,
  VOX_SPEECH_WAVE_MS,
  VOX_SPEECH_WAVES,
} from "./arenaVoxSpeechEffect.constants";
import type { ISpeechReach } from "./arenaVoxSpeechEffect.types";

/**
 * The waves of Marion's voice `elapsed` milliseconds in: a full ring opening around her as she starts to speak,
 * then waves rolling toward the target one after another, each widening and thickening as it goes, strong and
 * softer in turn (her voice and its echo); the last one reaches the target at the hit.
 */
export function speechWaves(elapsed: number, { distance }: ISpeechReach): ISoundWave[] {
  const waves: ISoundWave[] = [];
  const open = elapsed / VOX_SPEECH_OPEN_MS;
  if (open > 0 && open < 1)
    waves.push({
      radius: 0.8 + 2.4 * open,
      strength: 0.8 * Math.sin(Math.PI * open),
      thickness: 0.4 + 0.3 * open,
      spread: Math.PI,
    });
  const last = VOX_SPEECH_HIT_MS - VOX_SPEECH_WAVE_MS;
  for (let index = 0; index < VOX_SPEECH_WAVES; index += 1) {
    const born =
      VOX_SPEECH_FIRST_MS + ((last - VOX_SPEECH_FIRST_MS) * index) / (VOX_SPEECH_WAVES - 1);
    const life = (elapsed - born) / VOX_SPEECH_WAVE_MS;
    if (life <= 0 || life >= 1) continue;
    const echo = index % 2 === 1;
    waves.push({
      radius: 0.9 + (Math.max(distance, 1) - 0.3) * life,
      strength: (echo ? 0.65 : 1) * Math.sin(Math.PI * life) ** 0.6 * (1 - 0.35 * life),
      thickness: 0.32 + 0.4 * life,
      spread: 0.42 + 0.38 * life,
    });
  }
  return waves;
}
