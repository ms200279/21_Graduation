import { describe, expect, it } from "vitest";

import {
  isAppleMobileWebKit,
  readsBackdropUrlFilter,
} from "./useLiquidGlass";

describe("liquid glass backdrop support", () => {
  it("treats iPhone and iPad as WebKit that cannot apply url() maps", () => {
    expect(
      isAppleMobileWebKit(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
        "iPhone",
        5,
      ),
    ).toBe(true);
    expect(
      isAppleMobileWebKit(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
        "MacIntel",
        5,
      ),
    ).toBe(true);
  });

  it("does not treat desktop Chrome as Apple mobile WebKit", () => {
    expect(
      isAppleMobileWebKit(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "MacIntel",
        0,
      ),
    ).toBe(false);
  });

  it("recognizes a parsed url() backdrop-filter value", () => {
    expect(readsBackdropUrlFilter("url(#test)")).toBe(true);
    expect(readsBackdropUrlFilter('url("#test")')).toBe(true);
    expect(readsBackdropUrlFilter("blur(16px)")).toBe(false);
  });
});
