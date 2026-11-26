import { describe, expect, it } from "vitest";

import { socketTarget } from "./socket.utils";

describe("socketTarget", () => {
  it("connects straight to an absolute API URL on the default path", () => {
    expect(socketTarget("http://localhost:3333")).toEqual({
      url: "http://localhost:3333",
      path: "/socket.io",
    });
  });

  it("connects to the page origin under the prefix of a relative API URL", () => {
    expect(socketTarget("/api")).toEqual({ url: undefined, path: "/api/socket.io" });
    expect(socketTarget("/api/")).toEqual({ url: undefined, path: "/api/socket.io" });
  });
});
