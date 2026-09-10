import { afterEach, describe, expect, it } from "vitest";

import {
  applySafeAreaMetrics,
  applyViewportMetrics,
  measureCssLength,
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
      innerHeight: 760,
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
      offsetBottom: 12,
      svh: 700,
      dvh: 700,
      lvh: 760,
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
    expect(afterChrome.offsetBottom).toBe(124);
  });

  it("does not shrink svh when the software keyboard covers the bottom", () => {
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

    const withKeyboard = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 520,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(withKeyboard.svh).toBe(844);
    expect(withKeyboard.dvh).toBe(520);
    expect(withKeyboard.offsetBottom).toBe(324);
  });

  it("does not lock svh to the keyboard after iOS pans the visual viewport", () => {
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

    const withKeyboard = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 520,
        offsetTop: 200,
        offsetLeft: 0,
      },
    });

    expect(withKeyboard.offsetBottom).toBe(124);
    expect(withKeyboard.svh).toBe(844);
    expect(withKeyboard.dvh).toBe(520);

    const afterDismiss = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 844,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(afterDismiss.svh).toBe(844);
    expect(afterDismiss.dvh).toBe(844);
    expect(afterDismiss.offsetBottom).toBe(0);
  });

  it("does not lock svh when innerHeight shrinks with the keyboard", () => {
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

    const withKeyboard = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 520,
      visualViewport: {
        width: 390,
        height: 520,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(withKeyboard.offsetBottom).toBe(0);
    expect(withKeyboard.svh).toBe(844);
    expect(withKeyboard.dvh).toBe(520);

    const afterDismiss = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 844,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(afterDismiss.svh).toBe(844);
    expect(afterDismiss.offsetBottom).toBe(0);
  });

  it("keeps chrome svh stable through a keyboard that innerHeight also follows", () => {
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

    const withKeyboard = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 520,
      visualViewport: {
        width: 390,
        height: 520,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(withKeyboard.svh).toBe(720);
    expect(withKeyboard.dvh).toBe(520);

    const afterDismiss = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 844,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(afterDismiss.svh).toBe(720);
    expect(afterDismiss.dvh).toBe(844);
  });

  it("recovers svh if the first reading was already keyboard-sized", () => {
    readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 520,
      visualViewport: {
        width: 390,
        height: 520,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    const afterDismiss = readVisualViewportMetrics({
      innerWidth: 390,
      innerHeight: 844,
      visualViewport: {
        width: 390,
        height: 844,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(afterDismiss.svh).toBe(844);
    expect(afterDismiss.dvh).toBe(844);
    expect(afterDismiss.offsetBottom).toBe(0);
  });

  it("resets height memory when the viewport width changes for orientation", () => {
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

    const landscape = readVisualViewportMetrics({
      innerWidth: 844,
      innerHeight: 390,
      visualViewport: {
        width: 844,
        height: 390,
        offsetTop: 0,
        offsetLeft: 0,
      },
    });

    expect(landscape.svh).toBe(390);
    expect(landscape.lvh).toBe(390);
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
      offsetTop: 0,
      offsetLeft: 0,
      offsetBottom: 0,
      svh: 640,
      dvh: 640,
      lvh: 640,
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
      offsetBottom: 28,
      svh: 700,
      dvh: 720,
      lvh: 844,
    });

    expect(root.style.getPropertyValue("--app-vw")).toBe("390px");
    expect(root.style.getPropertyValue("--app-vh")).toBe("720px");
    expect(root.style.getPropertyValue("--app-svh")).toBe("700px");
    expect(root.style.getPropertyValue("--app-dvh")).toBe("720px");
    expect(root.style.getPropertyValue("--app-lvh")).toBe("844px");
    expect(root.style.getPropertyValue("--vv-top")).toBe("12px");
    expect(root.style.getPropertyValue("--vv-left")).toBe("4px");
    expect(root.style.getPropertyValue("--vv-bottom")).toBe("28px");
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

describe("measureCssLength", () => {
  it("resolves a pixel length on a probe element", () => {
    expect(measureCssLength("48px")).toBe(48);
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
