import { describe, expect, it } from "vitest";

import { getDeferredMediaSrc } from "./useInView";

describe("getDeferredMediaSrc", () => {
  it("omits the src until the media should load", () => {
    expect(getDeferredMediaSrc("/images/bg2.webm", false)).toBeUndefined();
    expect(getDeferredMediaSrc("/images/bg2.webm", true)).toBe("/images/bg2.webm");
  });
});
