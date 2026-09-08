import { afterEach, describe, expect, it } from "vitest";

import {
  applySafeAreaMetrics,
  applyViewportMetrics,
  readSafeAreaFromProbe,
  readVisualViewportMetrics,
  resetViewportMetricsMemory,
} from "./viewportMetrics";
import { detectWebGLSupport } from "./webglSupport";

afterEach(() => {
  resetViewportMetricsMemory();
});

describe("readVisualViewportMetrics", () => {
  it("prefers visualViewport size when present", () => {
    const metrics = readVisualViewportMetrics({
      innerWidth: 430,
      innerHeight: 932,
      visualViewport: {
        width: 390,
        height: 700,
        offsetTop: 48,
        offsetLeft: 0,
      },
    });

    expect(metrics).toMatchObject({
      width: 390,
      height: 700,
      offsetTop: 48,
      offsetLeft: 0,
      svh: 700,
      dvh: 700,
    });
  });

  it("remembers the smallest height as svh across updates", () => {
    readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 844,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    const afterChrome = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 720,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(afterChrome.svh).toBe(720);
    expect(afterChrome.dvh).toBe(720);
  });

  it("falls back to innerWidth/innerHeight without visualViewport", () => {
    expect(
      readVisualViewportMetrics({
        innerWidth: 360,
        innerHeight: 640,
        visualViewport: null,
      }),
    ).toMatchObject({
      width: 360,
      height: 640,
      svh: 640,
      dvh: 640,
    });
  });
});

describe("applyViewportMetrics", () => {
  it("writes snap tokens onto the root element", () => {
    const root = document.createElement("html");

    applyViewportMetrics(root, {
      width: 390,
      height: 720,
      offsetTop: 12,
      offsetLeft: 4,
      svh: 700,
      dvh: 720,
    });

    expect(root.style.getPropertyValue("--app-vw")).toBe("390px");
    expect(root.style.getPropertyValue("--app-vh")).toBe("720px");
    expect(root.style.getPropertyValue("--app-svh")).toBe("700px");
    expect(root.style.getPropertyValue("--app-dvh")).toBe("720px");
    expect(root.style.getPropertyValue("--vv-top")).toBe("12px");
    expect(root.style.getPropertyValue("--vv-left")).toBe("4px");
  });
});

describe("safe area probe", () => {
  it("copies computed padding into CSS variables", () => {
    const root = document.createElement("div");
    const probe = document.createElement("div");
    const originalGetComputedStyle = window.getComputedStyle.bind(window);

    window.getComputedStyle = ((element: Element) => {
      if (element === probe) {
        return {
          paddingTop: "47px",
          paddingRight: "0px",
          paddingBottom: "34px",
          paddingLeft: "0px",
        } as CSSStyleDeclaration;
      }

      return originalGetComputedStyle(element);
    }) as typeof window.getComputedStyle;

    try {
      applySafeAreaMetrics(root, readSafeAreaFromProbe(probe));
      expect(root.style.getPropertyValue("--safe-top-js")).toBe("47px");
      expect(root.style.getPropertyValue("--safe-bottom-js")).toBe("34px");
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
    }
  });
});

describe("detectWebGLSupport", () => {
  it("returns ok when a webgl context exists", () => {
    expect(
      detectWebGLSupport(
        () =>
          ({
            getContext: (type: string) => (type === "webgl" ? {} : null),
          }) as HTMLCanvasElement,
      ),
    ).toBe("ok");
  });

  it("returns fallback when no context can be created", () => {
    expect(
      detectWebGLSupport(
        () =>
          ({
            getContext: () => null,
          }) as unknown as HTMLCanvasElement,
      ),
    ).toBe("fallback");
  });

  it("returns fallback when canvas creation throws", () => {
    expect(
      detectWebGLSupport(() => {
        throw new Error("canvas blocked");
      }),
    ).toBe("fallback");
  });
});
