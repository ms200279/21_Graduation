export const MOBILE_VIEWPORT_EVENT = "mobile-viewportchange";

export const KEYBOARD_COVER_PX = 180;

export type ViewportMetrics = {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
  offsetBottom: number;
  svh: number;
  dvh: number;
  lvh: number;
};

export type SafeAreaInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type ViewportSource = Pick<Window, "innerWidth" | "innerHeight"> & {
  visualViewport?: Pick<
    VisualViewport,
    "width" | "height" | "offsetTop" | "offsetLeft"
  > | null;
};

let minSeenHeight = Number.POSITIVE_INFINITY;
let maxSeenHeight = 0;

export function resetViewportMetricsMemory() {
  minSeenHeight = Number.POSITIVE_INFINITY;
  maxSeenHeight = 0;
}

export function readVisualViewportMetrics(
  view: ViewportSource,
): ViewportMetrics {
  const visualViewport = view.visualViewport;
  const width = visualViewport?.width ?? view.innerWidth;
  const height = visualViewport?.height ?? view.innerHeight;
  const offsetTop = visualViewport?.offsetTop ?? 0;
  const offsetLeft = visualViewport?.offsetLeft ?? 0;
  const layoutHeight = view.innerHeight;
  const offsetBottom = Math.max(0, layoutHeight - offsetTop - height);
  const likelyKeyboard = offsetBottom > KEYBOARD_COVER_PX;

  if (!likelyKeyboard) {
    minSeenHeight = Math.min(minSeenHeight, height);
    maxSeenHeight = Math.max(maxSeenHeight, layoutHeight, height + offsetTop);
  }

  const svh = Number.isFinite(minSeenHeight) ? minSeenHeight : height;
  const lvh = maxSeenHeight > 0 ? maxSeenHeight : layoutHeight;

  return {
    width,
    height,
    offsetTop,
    offsetLeft,
    offsetBottom,
    svh,
    dvh: height,
    lvh,
  };
}

export function applyViewportMetrics(
  root: HTMLElement,
  metrics: ViewportMetrics,
) {
  root.style.setProperty("--app-vw", `${metrics.width}px`);
  root.style.setProperty("--app-vh", `${metrics.height}px`);
  root.style.setProperty("--app-svh", `${metrics.svh}px`);
  root.style.setProperty("--app-dvh", `${metrics.dvh}px`);
  root.style.setProperty("--app-lvh", `${metrics.lvh}px`);
  root.style.setProperty("--vv-top", `${metrics.offsetTop}px`);
  root.style.setProperty("--vv-left", `${metrics.offsetLeft}px`);
  root.style.setProperty("--vv-bottom", `${metrics.offsetBottom}px`);
}

export function readSafeAreaFromProbe(probe: HTMLElement): SafeAreaInsets {
  const styles = getComputedStyle(probe);

  return {
    top: Number.parseFloat(styles.paddingTop) || 0,
    right: Number.parseFloat(styles.paddingRight) || 0,
    bottom: Number.parseFloat(styles.paddingBottom) || 0,
    left: Number.parseFloat(styles.paddingLeft) || 0,
  };
}

export function applySafeAreaMetrics(root: HTMLElement, insets: SafeAreaInsets) {
  root.style.setProperty("--safe-top-js", `${insets.top}px`);
  root.style.setProperty("--safe-right-js", `${insets.right}px`);
  root.style.setProperty("--safe-bottom-js", `${insets.bottom}px`);
  root.style.setProperty("--safe-left-js", `${insets.left}px`);
}

export function dispatchMobileViewportChange(target: EventTarget = window) {
  target.dispatchEvent(new Event(MOBILE_VIEWPORT_EVENT));
}

export function measureCssLength(length: string, fallback = 0) {
  const trimmed = length.trim();

  if (!trimmed) {
    return fallback;
  }

  const pxMatch = /^(-?\d+(?:\.\d+)?)px$/i.exec(trimmed);
  if (pxMatch) {
    return Number.parseFloat(pxMatch[1]);
  }

  if (typeof document === "undefined") {
    return fallback;
  }

  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;height:${trimmed};`;
  document.documentElement.appendChild(probe);
  const value = probe.getBoundingClientRect().height;
  probe.remove();

  return Number.isFinite(value) && value > 0 ? value : fallback;
}
