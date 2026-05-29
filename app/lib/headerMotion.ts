export const headerMotionBezier = {
  x1: 0.34,
  y1: 1.56,
  x2: 0.64,
  y2: 1,
} as const;

function sampleCurve(
  t: number,
  p1: number,
  p2: number,
) {
  const inv = 1 - t;

  return (
    3 * inv * inv * t * p1 +
    3 * inv * t * t * p2 +
    t * t * t
  );
}

export function mapScrollToHeaderMotionProgress(linearProgress: number) {
  return mapBezierProgress(linearProgress);
}

export function mapScrollToLabelMotionProgress(
  linearProgress: number,
  completionRatio = 0.38,
) {
  return mapBezierProgress(Math.min(1, linearProgress / completionRatio));
}

function mapBezierProgress(linearProgress: number) {
  const clamped = Math.min(1, Math.max(0, linearProgress));

  if (clamped <= 0) {
    return 0;
  }

  if (clamped >= 1) {
    return 1;
  }

  let start = 0;
  let end = 1;

  for (let index = 0; index < 12; index += 1) {
    const mid = (start + end) / 2;

    if (sampleCurve(mid, headerMotionBezier.x1, headerMotionBezier.x2) < clamped) {
      start = mid;
    } else {
      end = mid;
    }
  }

  const param = (start + end) / 2;

  return sampleCurve(param, headerMotionBezier.y1, headerMotionBezier.y2);
}
