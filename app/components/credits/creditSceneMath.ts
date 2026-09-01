import type { FragmentPoint } from "./creditData";

export type CreditLabelCorner =
  | "top-left"
  | "top-right"
  | "bottom-right";

export function isPointInsidePolygon(
  x: number,
  y: number,
  polygon: readonly FragmentPoint[],
) {
  let inside = false;

  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index, index += 1
  ) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[previous];
    const crossesEdge = y1 > y !== y2 > y;

    if (crossesEdge && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }

  return inside;
}

export function getPolygonCentroid(points: readonly FragmentPoint[]) {
  let x = 0;
  let y = 0;

  for (const point of points) {
    x += point[0];
    y += point[1];
  }

  return [x / points.length, y / points.length] as const;
}

export function getPolygonBounds(points: readonly FragmentPoint[]) {
  return points.reduce(
    (bounds, [x, y]) => ({
      minX: Math.min(bounds.minX, x),
      maxX: Math.max(bounds.maxX, x),
      minY: Math.min(bounds.minY, y),
      maxY: Math.max(bounds.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

export function scoreLabelPosition(
  x: number,
  y: number,
  corner: CreditLabelCorner,
) {
  return corner === "top-left"
    ? -x + y * 0.82
    : corner === "top-right"
      ? x + y * 0.82
      : x - y * 0.82;
}

export function getSelectedFragmentPosition(
  centroidX: number,
  bounds: { minX: number; maxX: number; maxY: number },
  selectedScale: number,
  isMobile: boolean,
) {
  const horizontalEdge = isMobile ? 2.35 : 4.55;
  const topEdge = isMobile ? 1.58 : 1.9;
  const x =
    centroidX <= 0
      ? -horizontalEdge - bounds.minX * selectedScale
      : horizontalEdge - bounds.maxX * selectedScale;

  return [x, topEdge - bounds.maxY * selectedScale, 0.95] as const;
}

export function getOffscreenFragmentPosition(
  centroidX: number,
  centroidY: number,
) {
  const length = Math.hypot(centroidX, centroidY);
  const directionX = length < 0.1 ? 0 : centroidX / length;
  const directionY = length < 0.1 ? -1 : centroidY / length;

  return [
    directionX * 9.5 - centroidX,
    directionY * 7 - centroidY,
    -0.7,
  ] as const;
}
