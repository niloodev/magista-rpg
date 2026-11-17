import { Container, Matrix, type Application, type Filter, type RenderTexture } from "pixi.js";
import { describe, expect, it, vi } from "vitest";

import { ArenaFxScreen } from "./arenaFxScreen";

function screenOf(world = new Container()) {
  const stage = new Container();
  stage.addChild(world);
  const render = vi.fn();
  const app = {
    stage,
    screen: { width: 800, height: 600 },
    renderer: { render },
  } as unknown as Application;
  return { screen: new ArenaFxScreen(app, world, world), world, stage, render };
}

describe("ArenaFxScreen", () => {
  it("puts its layer right above the world", () => {
    const { screen, stage, world } = screenOf();
    expect(stage.getChildIndex(screen.layer)).toBe(stage.getChildIndex(world) + 1);
  });

  it("adds a world filter once and clears the filters when the last one leaves", () => {
    const { screen, world } = screenOf();
    const tint = {} as Filter;
    const split = {} as Filter;
    screen.addWorldFilter(tint);
    screen.addWorldFilter(tint);
    screen.addWorldFilter(split);
    expect(world.filters).toEqual([tint, split]);
    screen.removeWorldFilter(tint);
    expect(world.filters).toEqual([split]);
    screen.removeWorldFilter(split);
    expect(world.filters).toBeNull();
  });

  it("lets only the first claim of a key play until it expires", () => {
    vi.useFakeTimers();
    const { screen } = screenOf();
    expect(screen.claim("vox", 1000)).toBe(true);
    expect(screen.claim("vox", 1000)).toBe(false);
    expect(screen.claim("other", 1000)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(screen.claim("vox", 1000)).toBe(true);
    vi.useRealTimers();
  });

  it("grants at most the limit of live reservations of a key, and more once they expire", () => {
    vi.useFakeTimers();
    const { screen } = screenOf();
    expect(screen.reserve("fire", 2, 1000)).toBe(true);
    expect(screen.reserve("fire", 2, 1000)).toBe(true);
    expect(screen.reserve("fire", 2, 1000)).toBe(false);
    expect(screen.reserve("smoke", 2, 1000)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(screen.reserve("fire", 2, 1000)).toBe(true);
    vi.useRealTimers();
  });

  it("keeps the filter area on the visible screen in the world's own coordinates", () => {
    const world = new Container();
    world.scale.set(2);
    world.position.set(100, 50);
    const { screen } = screenOf(world);
    screen.addWorldFilter({} as Filter);
    world.updateLocalTransform();
    screen.fitWorldFilters();
    expect(world.filterArea).toMatchObject({ x: -50, y: -25, width: 400, height: 300 });
  });

  it("gives a spell the whole screen and a margin past its edges", () => {
    const { screen } = screenOf();
    expect(screen.field()).toMatchObject({ x: -120, y: -120, width: 1040, height: 840 });
  });

  it("draws off screen into a texture, cleared to transparent, through a transform", () => {
    const { screen, render } = screenOf();
    const container = new Container();
    const target = {} as RenderTexture;
    const transform = new Matrix();
    screen.renderTo(container, target, transform);
    expect(render).toHaveBeenCalledWith({
      container,
      target,
      clear: true,
      clearColor: [0, 0, 0, 0],
      transform,
    });
  });
});
