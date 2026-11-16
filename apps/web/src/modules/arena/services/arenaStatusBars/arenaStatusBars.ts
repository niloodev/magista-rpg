import { ARENA_RESOURCE_KEYS, type IArenaTokenStatus } from "@magista/shared";
import { Container, Graphics, Text } from "pixi.js";

import {
  STATUS_BAR_COLORS,
  STATUS_BAR_VALUE_PX,
  STATUS_CHIP_DELAY_MS,
  STATUS_CHIP_MS,
  STATUS_FILL_MS,
  STATUS_FLOAT_FONT_PX,
  STATUS_FLOAT_MAX,
  STATUS_FLOAT_MS,
  STATUS_FLOAT_RISE_PX,
} from "./arenaStatusBars.constants";
import type {
  IStatusBarState,
  IStatusBarsOptions,
  IStatusTween,
  IStatusUpdate,
} from "./arenaStatusBars.types";
import {
  barLayout,
  easeOutCubic,
  resourceFraction,
  resourceLabel,
  stillTween,
  tweenValue,
} from "./arenaStatusBars.utils";

const TEXT_BASE_PX = 24;

interface IStatusFloat {
  text: Text;
  start: number;
  barIndex: number;
}

/**
 * Health and sanity bars drawn above one token (in the token's own coordinates). A change seen live slides the
 * fill to the new value while a lighter trail catches up (damage) or leads the way (healing), with a small
 * floating number; the light mode jumps straight to the value. The thickness compensates the zoom, and on
 * hover or selection the bars open to show the values inside.
 */
export class ArenaStatusBars {
  readonly container = new Container();
  private readonly graphics = new Graphics();
  private readonly labels: Text[] = [];
  private bars: IStatusBarState[] = [];
  private status: IArenaTokenStatus | null = null;
  private floats: IStatusFloat[] = [];
  private size = 0;
  private scale = 1;
  private expanded = false;

  constructor(private readonly options: IStatusBarsOptions) {
    this.container.eventMode = "none";
    this.container.addChild(this.graphics);
  }

  /** Whether some bar is shown (the token has a status with a maximum). */
  get visible(): boolean {
    return this.bars.length > 0;
  }

  /** Height of the bars above the token, in map pixels (0 without bars). */
  get height(): number {
    if (this.bars.length === 0) return 0;
    const { thickness, gap, lift } = barLayout(this.size, this.scale, this.expanded);
    return this.bars.length * (thickness + gap) - gap + lift;
  }

  setStatus(status: IArenaTokenStatus | null, update: IStatusUpdate, now: number): void {
    this.status = status;
    const animate = update.animate && !this.options.lite;
    const next: IStatusBarState[] = [];
    for (const key of ARENA_RESOURCE_KEYS) {
      const resource = status?.[key];
      const fraction = resource ? resourceFraction(resource) : null;
      if (!resource || fraction === null || resource.max === null) continue;
      const current = resource.current ?? resource.max;
      const previous = this.bars.find((bar) => bar.key === key);
      if (previous && animate && previous.current !== current) {
        const { fill, chip } = this.tweensFor(previous, fraction, now);
        next.push({ key, current, max: resource.max, fill, chip });
        if (update.float) this.spawnFloat(next.length - 1, key, current - previous.current, now);
      } else if (previous && animate) {
        next.push({ ...previous, max: resource.max });
      } else {
        next.push({
          key,
          current,
          max: resource.max,
          fill: stillTween(fraction),
          chip: stillTween(fraction),
        });
      }
    }
    this.bars = next;
    this.draw(now);
  }

  /** Follows the token size and the camera zoom. */
  layout(size: number, cameraScale: number, now: number): void {
    if (size === this.size && cameraScale === this.scale) return;
    this.size = size;
    this.scale = cameraScale;
    this.draw(now);
  }

  /** Opens the bars to show the values (hover or selection). */
  setExpanded(expanded: boolean, now: number): void {
    if (expanded === this.expanded) return;
    this.expanded = expanded;
    this.draw(now);
  }

  /** Advances the animation; true while something still moves. */
  step(now: number): boolean {
    const moving = this.bars.some(
      (bar) => !tweenValue(bar.fill, now).done || !tweenValue(bar.chip, now).done,
    );
    if (moving || this.floats.length > 0) this.draw(now);
    return moving || this.floats.length > 0;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }

  private tweensFor(previous: IStatusBarState, fraction: number, now: number) {
    const shownFill = tweenValue(previous.fill, now).value;
    const shownChip = tweenValue(previous.chip, now).value;
    if (fraction < shownFill) {
      const fill: IStatusTween = {
        from: shownFill,
        to: fraction,
        start: now,
        delay: 0,
        duration: STATUS_FILL_MS,
      };
      const chip: IStatusTween = {
        from: Math.max(shownChip, shownFill),
        to: fraction,
        start: now,
        delay: STATUS_CHIP_DELAY_MS,
        duration: STATUS_CHIP_MS,
      };
      return { fill, chip };
    }
    const fill: IStatusTween = {
      from: shownFill,
      to: fraction,
      start: now,
      delay: STATUS_CHIP_DELAY_MS / 2,
      duration: STATUS_CHIP_MS,
    };
    return { fill, chip: stillTween(fraction) };
  }

  private spawnFloat(barIndex: number, key: IStatusBarState["key"], delta: number, now: number) {
    const color = key === "health" ? STATUS_BAR_COLORS.healthChip : STATUS_BAR_COLORS.sanityChip;
    const text = new Text({
      text: delta > 0 ? `+${delta}` : `${delta}`,
      style: {
        fontFamily: this.options.fontFamily,
        fontSize: TEXT_BASE_PX,
        fontWeight: "700",
        fill: color,
        stroke: { color: STATUS_BAR_COLORS.stroke, width: 5, join: "round" },
      },
    });
    text.anchor.set(0, 0.5);
    this.container.addChild(text);
    this.floats.push({ text, start: now, barIndex });
    while (this.floats.length > STATUS_FLOAT_MAX) this.floats.shift()?.text.destroy();
  }

  private label(index: number): Text {
    const existing = this.labels[index];
    if (existing) return existing;
    const text = new Text({
      text: "",
      style: {
        fontFamily: this.options.fontFamily,
        fontSize: TEXT_BASE_PX,
        fontWeight: "700",
        fill: STATUS_BAR_COLORS.value,
        stroke: { color: STATUS_BAR_COLORS.stroke, width: 5, join: "round" },
      },
    });
    text.anchor.set(0.5);
    this.labels[index] = text;
    this.container.addChild(text);
    return text;
  }

  private draw(now: number): void {
    const graphics = this.graphics.clear();
    const { width, thickness, gap, lift } = barLayout(this.size, this.scale, this.expanded);
    const total = this.bars.length * (thickness + gap) - gap;
    const top = -this.size / 2 - lift - total;
    const left = -width / 2;
    const border = 1 / (this.scale || 1);
    this.bars.forEach((bar, index) => {
      const y = top + index * (thickness + gap);
      const fill = tweenValue(bar.fill, now).value;
      const chip = tweenValue(bar.chip, now).value;
      const health = bar.key === "health";
      graphics
        .rect(left, y, width, thickness)
        .fill({ color: STATUS_BAR_COLORS.track, alpha: 0.85 })
        .stroke({ width: border, color: STATUS_BAR_COLORS.border, alpha: 0.9 });
      if (chip > 0)
        graphics.rect(left, y, width * chip, thickness).fill({
          color: health ? STATUS_BAR_COLORS.healthChip : STATUS_BAR_COLORS.sanityChip,
          alpha: 0.7,
        });
      if (fill > 0)
        graphics.rect(left, y, width * fill, thickness).fill({
          color: health ? STATUS_BAR_COLORS.health : STATUS_BAR_COLORS.sanity,
        });
      const label = this.label(index);
      label.visible = this.expanded;
      if (this.expanded) {
        const resource = this.status?.[bar.key];
        label.text = resource ? resourceLabel(resource) : "";
        label.scale.set(STATUS_BAR_VALUE_PX / TEXT_BASE_PX / (this.scale || 1));
        label.position.set(0, y + thickness / 2);
      }
    });
    for (let index = this.bars.length; index < this.labels.length; index += 1) {
      const label = this.labels[index];
      if (label) label.visible = false;
    }
    this.floats = this.floats.filter((float) => {
      const t = (now - float.start) / STATUS_FLOAT_MS;
      if (t >= 1) {
        float.text.destroy();
        return false;
      }
      const y = top + float.barIndex * (thickness + gap) + thickness / 2;
      const rise = (STATUS_FLOAT_RISE_PX * easeOutCubic(t)) / (this.scale || 1);
      float.text.scale.set(STATUS_FLOAT_FONT_PX / TEXT_BASE_PX / (this.scale || 1));
      float.text.position.set(width / 2 + 4 / (this.scale || 1), y - rise);
      float.text.alpha = t < 0.5 ? 1 : 1 - (t - 0.5) * 2;
      return true;
    });
  }
}
