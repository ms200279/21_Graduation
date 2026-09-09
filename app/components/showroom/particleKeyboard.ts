export const TEXT_ORIGIN_RATIO = 0.47;
export const JELLYFISH_ORIGIN_RATIO = 0.39;
export const MIN_ORIGIN_RATIO = 0.18;

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

export function getLiftedOriginY(
  height: number,
  baseRatio: number,
  keyboardShift: number,
  minRatio = MIN_ORIGIN_RATIO,
) {
  return Math.max(height * minRatio, height * baseRatio - keyboardShift);
}
