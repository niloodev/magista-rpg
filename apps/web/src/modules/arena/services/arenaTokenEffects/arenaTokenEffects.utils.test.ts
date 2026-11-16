import { describe, expect, it } from "vitest";

import {
  bladeOutline,
  mixColor,
  particlePosition,
  particleVelocity,
  amountLabel,
  bump,
  burst,
  crackPath,
  easeOutBack,
  effectStyle,
  phase,
  seededRandom,
  shake,
} from "./arenaTokenEffects.utils";

describe("token effects", () => {
  it("picks one animation per change", () => {
    expect(effectStyle("damage", "health")).toBe("strike");
    expect(effectStyle("damage", "sanity")).toBe("fissure");
    expect(effectStyle("heal", "health")).toBe("ember");
    expect(effectStyle("heal", "sanity")).toBe("clarity");
  });

  it("repeats the same random sequence for the same seed", () => {
    const first = seededRandom(7);
    const second = seededRandom(7);
    const values = [first(), first(), first()];
    expect([second(), second(), second()]).toEqual(values);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it("measures phases and bumps", () => {
    expect(phase(0.1, 0.2, 0.4)).toBe(0);
    expect(phase(0.3, 0.2, 0.4)).toBeCloseTo(0.5);
    expect(phase(0.9, 0.2, 0.4)).toBe(1);
    expect(bump(0.5)).toBeCloseTo(1);
    expect(bump(0)).toBe(0);
    expect(bump(1)).toBe(0);
  });

  it("shakes and then rests", () => {
    expect(Math.abs(shake(0.05, 6))).toBeGreaterThan(0);
    expect(shake(0.6, 6)).toBe(0);
  });

  it("overshoots and settles", () => {
    expect(easeOutBack(0)).toBeCloseTo(0);
    expect(easeOutBack(1)).toBeCloseTo(1);
    expect(easeOutBack(0.6)).toBeGreaterThan(1);
  });

  it("builds particles and cracks", () => {
    const random = seededRandom(3);
    expect(burst(8, random)).toHaveLength(8);
    const crack = crackPath(0, 4, random);
    expect(crack).toHaveLength(5);
    expect(Math.hypot(crack[4]?.x ?? 0, crack[4]?.y ?? 0)).toBeCloseTo(1);
  });

  it("writes the amount", () => {
    expect(amountLabel("damage", 5)).toBe("-5");
    expect(amountLabel("heal", 3)).toBe("+3");
  });
});

describe("token effects: particles", () => {
  const spawn = { x: 0, y: 0, vx: 100, vy: 0, drag: 2, gravity: 50, born: 0, life: 1 };

  it("slows down with drag and falls with gravity", () => {
    const early = particlePosition(spawn, 0.1);
    const late = particlePosition(spawn, 1);
    expect(early.x).toBeGreaterThan(0);
    expect(late.x).toBeLessThan(100 / spawn.drag);
    expect(late.y).toBeCloseTo(25);
    expect(particleVelocity(spawn, 1).x).toBeCloseTo(100 * Math.exp(-2));
    expect(particlePosition({ ...spawn, drag: 0 }, 1).x).toBe(100);
  });

  it("mixes colors", () => {
    expect(mixColor(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(mixColor(0xff0000, 0x00ff00, 1)).toBe(0x00ff00);
  });

  it("draws a blade thin at the tips and closed", () => {
    const outline = bladeOutline({ x: 0, y: 0 }, { x: 100, y: 0 }, 0, 10, 0, 1, 4);
    expect(outline).toHaveLength(20);
    expect(outline[0]).toBeCloseTo(0);
    expect(outline[1]).toBeCloseTo(0);
    expect(Math.abs((outline[5] ?? 0) - (outline[15] ?? 0))).toBeCloseTo(10);
  });
});
