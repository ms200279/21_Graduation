export const LANDING_HERO_VIDEO_SRC = "/images/bg.webm";
export const LANDING_SPLASH_HOLD_MS = 900;
export const LANDING_SPLASH_RESOURCE_LIMIT_MS = 2200;
export const LANDING_SPLASH_MORPH_MS = 900;
export const LANDING_SPLASH_SESSION_KEY = "landing-splash-shown-v2";
export const LANDING_SPLASH_PLAY_FLAG = "__LANDING_SPLASH_PLAY";
export const LANDING_SPLASH_BOOT_STYLE_ID = "landing-splash-boot";

export function shouldPlayLandingSplash(
  pendingClass: boolean,
  playFlag: boolean,
) {
  return pendingClass || playFlag;
}

export type LandingSplashTarget = {
  x: number;
  y: number;
  radius: number;
};

export function getHeaderOrbFallback(
  isMobile: boolean,
  viewportWidth: number,
): LandingSplashTarget {
  if (isMobile) {
    return {
      x: viewportWidth - 38,
      y: 32,
      radius: 22,
    };
  }

  return {
    x: viewportWidth / 2 - 240,
    y: 36,
    radius: 26,
  };
}

export function getHeaderOrbTarget(
  element: Pick<DOMRect, "left" | "top" | "width" | "height"> | null,
  isMobile: boolean,
  viewportWidth: number,
): LandingSplashTarget {
  if (element && element.width > 0 && element.height > 0) {
    return {
      x: element.left + element.width / 2,
      y: element.top + element.height / 2,
      radius: Math.max(element.width, element.height) / 2,
    };
  }

  return getHeaderOrbFallback(isMobile, viewportWidth);
}

export function getSplashDiskCover(
  target: LandingSplashTarget,
  viewportWidth: number,
  viewportHeight: number,
) {
  const radius = Math.max(target.radius, 1);
  const coverRadius = Math.hypot(viewportWidth / 2, viewportHeight / 2);

  return {
    dx: viewportWidth / 2 - target.x,
    dy: viewportHeight / 2 - target.y,
    scale: Math.max(coverRadius / radius, 1) * 1.08,
  };
}
