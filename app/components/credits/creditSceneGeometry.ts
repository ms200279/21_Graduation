import * as THREE from "three";

import type { FragmentPoint } from "./creditData";

const PANEL_DEPTH = 0.12;
const PANEL_BEVEL_SIZE = 0.025;
const PANEL_BEVEL_THICKNESS = 0.018;
const PANEL_CORNER_RADIUS = 0.16;

export function createCreditFragmentGeometry(
  points: readonly FragmentPoint[],
) {
  const shape = new THREE.Shape();
  const corners = points.map(([x, y], index) => {
    const [previousX, previousY] =
      points[(index - 1 + points.length) % points.length];
    const [nextX, nextY] = points[(index + 1) % points.length];
    const previousDistance = Math.hypot(previousX - x, previousY - y);
    const nextDistance = Math.hypot(nextX - x, nextY - y);
    const radius = Math.min(
      PANEL_CORNER_RADIUS,
      previousDistance * 0.24,
      nextDistance * 0.24,
    );

    return {
      vertex: new THREE.Vector2(x, y),
      entry: new THREE.Vector2(
        x + ((previousX - x) / previousDistance) * radius,
        y + ((previousY - y) / previousDistance) * radius,
      ),
      exit: new THREE.Vector2(
        x + ((nextX - x) / nextDistance) * radius,
        y + ((nextY - y) / nextDistance) * radius,
      ),
    };
  });

  shape.moveTo(corners[0].entry.x, corners[0].entry.y);
  corners.forEach((corner, index) => {
    const nextCorner = corners[(index + 1) % corners.length];

    shape.quadraticCurveTo(
      corner.vertex.x,
      corner.vertex.y,
      corner.exit.x,
      corner.exit.y,
    );
    shape.lineTo(nextCorner.entry.x, nextCorner.entry.y);
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: PANEL_DEPTH,
    bevelEnabled: true,
    bevelThickness: PANEL_BEVEL_THICKNESS,
    bevelSize: PANEL_BEVEL_SIZE,
    bevelOffset: 0,
    bevelSegments: 3,
    curveSegments: 8,
    steps: 1,
  });

  geometry.translate(0, 0, -PANEL_DEPTH / 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  const bounds = geometry.boundingBox;
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");

  if (bounds && uvs) {
    const width = Math.max(bounds.max.x - bounds.min.x, Number.EPSILON);
    const height = Math.max(bounds.max.y - bounds.min.y, Number.EPSILON);
    const fragmentAspect = width / height;
    const imageAspect = 16 / 9;
    const uScale = fragmentAspect < imageAspect ? fragmentAspect / imageAspect : 1;
    const vScale = fragmentAspect > imageAspect ? imageAspect / fragmentAspect : 1;

    for (let index = 0; index < positions.count; index += 1) {
      const normalizedX = (positions.getX(index) - bounds.min.x) / width;
      const normalizedY = (positions.getY(index) - bounds.min.y) / height;

      uvs.setXY(
        index,
        0.5 + (normalizedX - 0.5) * uScale,
        0.5 + (normalizedY - 0.5) * vScale,
      );
    }

    uvs.needsUpdate = true;
  }

  return geometry;
}
