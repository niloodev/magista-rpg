import { describe, expect, it } from "vitest";

import { versionedUrl } from "./version";

describe("versioned URLs", () => {
  it("tags a URL with the version, keeping its query and hash", () => {
    expect(versionedUrl("/arena/world-map.jpg", "1.2.0")).toBe("/arena/world-map.jpg?v=1.2.0");
    expect(versionedUrl("http://api/media/a.webp?x=1", "2")).toBe(
      "http://api/media/a.webp?x=1&v=2",
    );
    expect(versionedUrl("/a.png#top", "3")).toBe("/a.png?v=3#top");
  });
});
