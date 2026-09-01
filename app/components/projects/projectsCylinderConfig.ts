export const PROJECT_CARD_COUNT = 77;
export const ROW_CARD_COUNT = 12;
export const ROTATION_SPEED_DEG = 0.028;
export const WHEEL_ROTATION_SCALE = 0.045;
export const WHEEL_SNAP_DELAY_MS = 140;
export const SNAP_ANIMATION_MS = 360;
export const BUTTON_INTERACTION_RELEASE_MS = SNAP_ANIMATION_MS + 80;
export const HOVER_SNAP_INTERVAL_MS = 500;
export const HOVER_MISS_LIMIT = 2;

const VISIBLE_CARD_BACKWARD = 2;
const VISIBLE_CARD_FORWARD = 3;

export type ProjectCard = {
  id: number;
};

export function getProjectDeck(seed: number): ProjectCard[] {
  return Array.from({ length: PROJECT_CARD_COUNT }, (_, index) => index + 1)
    .map((id) => ({
      id,
      sortKey: (id * 1103515245 + seed * 12345) >>> 0,
    }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map(({ id }) => ({ id }));
}

export function getAllProjectCards(): ProjectCard[] {
  return Array.from({ length: PROJECT_CARD_COUNT }, (_, index) => ({
    id: index + 1,
  }));
}

const INITIAL_PROJECT_DECK = getProjectDeck(1);

export const INITIAL_UPPER_CARDS = INITIAL_PROJECT_DECK.slice(
  0,
  ROW_CARD_COUNT,
);
export const INITIAL_LOWER_CARDS = INITIAL_PROJECT_DECK.slice(
  ROW_CARD_COUNT,
  ROW_CARD_COUNT * 2,
);
export const INITIAL_REMAINING_CARDS = INITIAL_PROJECT_DECK.slice(
  ROW_CARD_COUNT * 2,
);

export function getCylinderRadius() {
  return "calc((var(--projects-cylinder-card-width) + var(--projects-cylinder-gap)) / (2 * tan(15deg)) * 0.98)";
}

export function getCenteredAngleDistance(angle: number) {
  return ((angle + 180) % 360 + 360) % 360 - 180;
}

export function getBackCycle(angle: number) {
  return Math.floor((angle + 180) / 360);
}

export function isCardVisible(distanceFromFront: number, cardAngle: number) {
  return (
    distanceFromFront >= -cardAngle * (VISIBLE_CARD_BACKWARD + 0.5) &&
    distanceFromFront <= cardAngle * (VISIBLE_CARD_FORWARD + 0.5)
  );
}

export function getSnappedRotation(rotation: number, cardAngle: number) {
  return Math.round(rotation / cardAngle) * cardAngle;
}

export function getNearestCardCenteredRotation(
  index: number,
  cardAngle: number,
  currentRotation: number,
) {
  const baseRotation = -index * cardAngle;
  const loopOffset = Math.round((currentRotation - baseRotation) / 360) * 360;

  return baseRotation + loopOffset;
}

export function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}
