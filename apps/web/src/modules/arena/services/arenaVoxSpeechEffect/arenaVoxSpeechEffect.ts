import { Container, Sprite } from "pixi.js";

import type { IArenaAttackerInput } from "@/modules/arena/services/arenaEffectPlayers";
import { ArenaSoundWaveFilter } from "@/modules/arena/services/arenaSoundWave";
import {
  bump,
  phase,
  type IArenaEffectFrame,
  type IArenaEffectPlayer,
  type IArenaFxHost,
} from "@/modules/arena/services/arenaTokenEffects";
import { VOX_COLORS } from "@/modules/arena/services/arenaVoxPopuliEffect";

import {
  VOX_SPEECH_DURATION_MS,
  VOX_SPEECH_FIRST_MS,
  VOX_SPEECH_HIT_MS,
  VOX_SPEECH_WAVE_MS,
  VOX_SPEECH_WAVES,
} from "./arenaVoxSpeechEffect.constants";
import { speechWaves } from "./arenaVoxSpeechEffect.utils";

const REST: IArenaEffectFrame = { dx: 0, dy: 0, scaleX: 1, scaleY: 1 };

/**
 * Marion's part of "Vox Populi": she speaks and her voice is seen. A ring of sound opens around her, then waves
 * of compressed air roll from her to the target, rippling the map and everything on it as they pass (a filter on
 * the world, colors splitting on each crest); the rumor appears on the target when the words arrive. She leans
 * into each word over a faint red glow.
 */
export class ArenaVoxSpeechEffect implements IArenaEffectPlayer {
  readonly container = new Container();
  private readonly aura: Sprite;
  private readonly sound = new ArenaSoundWaveFilter({ tint: VOX_COLORS.rose });
  private readonly distance: number;
  private speaking = false;
  private start: number | null = null;

  constructor(
    private readonly options: IArenaAttackerInput,
    private readonly host: IArenaFxHost,
  ) {
    const r = options.size / 2;
    this.distance = Math.hypot(options.toward.x, options.toward.y) / Math.max(r, 1);
    this.aura = new Sprite(host.textures.glow);
    this.aura.anchor.set(0.5);
    this.aura.tint = VOX_COLORS.ruby;
    this.aura.blendMode = "add";
    this.container.eventMode = "none";
    this.container.addChild(this.aura);
  }

  step(now: number, cameraScale: number): { done: boolean; frame: IArenaEffectFrame } {
    this.start ??= now;
    const elapsed = now - this.start;
    const t = Math.min(elapsed / VOX_SPEECH_DURATION_MS, 1);
    if (t >= 1) {
      this.quiet();
      return { done: true, frame: REST };
    }
    const scale = cameraScale > 0 ? cameraScale : 1;
    const r = this.options.size / 2;
    const waves = speechWaves(elapsed, { distance: this.distance });
    if (waves.length > 0) {
      if (!this.speaking) {
        this.speaking = true;
        this.host.screen.addWorldFilter(this.sound);
      }
      this.host.screen.fitWorldFilters();
      this.sound.update({
        origin: this.host.screen.toScreen(this.container),
        direction: this.options.toward,
        unit: r * scale,
        waves,
      });
    } else this.quiet();
    const voice = phase(elapsed, 0, VOX_SPEECH_FIRST_MS) * (1 - phase(t, 0.7, 1));
    this.aura.width = this.aura.height = r * (3 + 0.5 * this.word(elapsed));
    this.aura.alpha = 0.35 * voice;
    const lean = this.word(elapsed) * 0.06;
    return { done: false, frame: { dx: 0, dy: 0, scaleX: 1 + lean * 0.5, scaleY: 1 - lean } };
  }

  /** How much she leans into the word she says now (a short bump as each wave leaves her). */
  private word(elapsed: number): number {
    const last = VOX_SPEECH_HIT_MS - VOX_SPEECH_WAVE_MS;
    let strongest = 0;
    for (let index = 0; index < VOX_SPEECH_WAVES; index += 1) {
      const born =
        VOX_SPEECH_FIRST_MS + ((last - VOX_SPEECH_FIRST_MS) * index) / (VOX_SPEECH_WAVES - 1);
      strongest = Math.max(strongest, bump(elapsed, born - 60, born + 120));
    }
    return strongest;
  }

  private quiet(): void {
    if (!this.speaking) return;
    this.speaking = false;
    this.host.screen.removeWorldFilter(this.sound);
  }

  destroy(): void {
    this.quiet();
    this.sound.destroy();
    this.container.destroy({ children: true });
  }
}
