export const TEXT_ORIGIN_RATIO = 0.47;
export const JELLYFISH_ORIGIN_RATIO = 0.39;
export const MIN_ORIGIN_RATIO = 0.18;
export const MOBILE_INPUT_RESERVE = 136;
export const MOBILE_ORIGIN_SHIFT = 32;

export function readBottomOverlap(
  sceneBottom: number,
  viewport: { offsetTop: number; height: number } | null | undefined,
) {
  if (!viewport) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(sceneBottom - (viewport.offsetTop + viewport.height)),
  );
}

export function sceneTracksVisualViewport(
  scene: { top: number; height: number },
  viewport: { offsetTop: number; height: number } | null | undefined,
  tolerance = 8,
) {
  if (!viewport) {
    return false;
  }

  return (
    Math.abs(scene.height - viewport.height) <= tolerance &&
    Math.abs(scene.top - viewport.offsetTop) <= tolerance
  );
}

export function getVisibleHeight(height: number, keyboardShift: number) {
  return Math.max(1, height - Math.max(0, keyboardShift));
}

export function getLiftedOriginY(
  height: number,
  baseRatio: number,
  keyboardShift: number,
  minRatio = MIN_ORIGIN_RATIO,
  bottomReserve = 0,
) {
  const visibleHeight = getVisibleHeight(height, keyboardShift);
  const usableHeight = Math.max(1, visibleHeight - Math.max(0, bottomReserve));

  return Math.max(usableHeight * minRatio, usableHeight * baseRatio);
}
