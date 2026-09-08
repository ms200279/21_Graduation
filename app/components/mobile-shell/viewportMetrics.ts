export const MOBILE_VIEWPORT_EVENT = "mobile-viewportchange";

export type ViewportMetrics = {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
  svh: number;
  dvh: number;
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

export function resetViewportMetricsMemory() {
  minSeenHeight = Number.POSITIVE_INFINITY;
}

export function readVisualViewportMetrics(
  view: ViewportSource,
): ViewportMetrics {
  const visualViewport = view.visualViewport;
  const width = visualViewport?.width ?? view.innerWidth;
  const height = visualViewport?.height ?? view.innerHeight;
  const offsetTop = visualViewport?.offsetTop ?? 0;
  const offsetLeft = visualViewport?.offsetLeft ?? 0;

  minSeenHeight = Math.min(minSeenHeight, height);

  return {
    width,
    height,
    offsetTop,
    offsetLeft,
    svh: minSeenHeight,
    dvh: height,
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
  root.style.setProperty("--vv-top", `${metrics.offsetTop}px`);
  root.style.setProperty("--vv-left", `${metrics.offsetLeft}px`);
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
