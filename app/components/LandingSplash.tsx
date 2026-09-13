"use client";

import {
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import {
  LANDING_SPLASH_BOOT_STYLE_ID,
  LANDING_SPLASH_HOLD_MS,
  LANDING_SPLASH_MORPH_MS,
  LANDING_SPLASH_PLAY_FLAG,
  LANDING_SPLASH_RESOURCE_LIMIT_MS,
  LANDING_SPLASH_SESSION_KEY,
  getHeaderOrbTarget,
  getSplashDiskCover,
  shouldPlayLandingSplash,
  type LandingSplashTarget,
} from "./landingSplashModel";
import "@/app/styles/landing-splash.css";

type SplashPhase = "holding" | "morphing" | "done";

function wait(duration: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function waitForFirstScreen(video: HTMLVideoElement | null) {
  const resources = Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    video && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
      ? new Promise<void>((resolve) => {
          const finish = () => {
            window.clearTimeout(timeout);
            video.removeEventListener("canplay", finish);
            video.removeEventListener("error", finish);
            resolve();
          };
          const timeout = window.setTimeout(finish, LANDING_SPLASH_RESOURCE_LIMIT_MS);

          video.addEventListener("canplay", finish, { once: true });
          video.addEventListener("error", finish, { once: true });
        })
      : Promise.resolve(),
  ]);

  return Promise.race([resources, wait(LANDING_SPLASH_RESOURCE_LIMIT_MS)]);
}

function measureHeaderOrb(): LandingSplashTarget {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const selector = isMobile
    ? "[data-landing-mobile-orb]"
    : "[data-landing-desktop-orb]";
  const element = document.querySelector<HTMLElement>(selector);

  return getHeaderOrbTarget(
    element?.getBoundingClientRect() ?? null,
    isMobile,
    window.innerWidth,
  );
}

function readLandingSplashPlayFlag() {
  return Boolean(
    (window as Window & { [LANDING_SPLASH_PLAY_FLAG]?: boolean })[
      LANDING_SPLASH_PLAY_FLAG
    ],
  );
}

function writeLandingSplashPlayFlag(value: boolean) {
  (window as Window & { [LANDING_SPLASH_PLAY_FLAG]?: boolean })[
    LANDING_SPLASH_PLAY_FLAG
  ] = value;
}

function isPendingLandingSplash() {
  return document.documentElement.classList.contains("landing-splash-pending");
}

function canPlayLandingSplash() {
  return shouldPlayLandingSplash(
    isPendingLandingSplash(),
    readLandingSplashPlayFlag(),
  );
}

function removeLandingSplashBootStyle() {
  document.getElementById(LANDING_SPLASH_BOOT_STYLE_ID)?.remove();
}

export default function LandingSplash() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [phase, setPhase] = useState<SplashPhase>("holding");
  const [target, setTarget] = useState<LandingSplashTarget>({
    x: 0,
    y: 0,
    radius: 24,
  });
  const [cover, setCover] = useState({ dx: 0, dy: 0, scale: 40 });

  useLayoutEffect(() => {
    if (!canPlayLandingSplash()) {
      const skipFrame = window.requestAnimationFrame(() => {
        removeLandingSplashBootStyle();
        setPhase("done");
      });

      return () => {
        window.cancelAnimationFrame(skipFrame);
      };
    }

    let cancelled = false;
    let finishTimer = 0;
    let morphFrame = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const heroVideo = document.querySelector<HTMLVideoElement>(
      "[data-landing-first-screen-video]",
    );

    writeLandingSplashPlayFlag(true);
    window.sessionStorage.setItem(LANDING_SPLASH_SESSION_KEY, "1");
    document.documentElement.classList.add(
      "landing-splash-pending",
      "landing-splash-active",
    );
    heroVideo?.load();

    const syncTarget = () => {
      const nextTarget = measureHeaderOrb();
      setTarget(nextTarget);
      setCover(
        getSplashDiskCover(nextTarget, window.innerWidth, window.innerHeight),
      );
    };

    syncTarget();

    void Promise.all([
      wait(LANDING_SPLASH_HOLD_MS),
      waitForFirstScreen(heroVideo),
    ]).then(() => {
      if (cancelled) {
        return;
      }

      syncTarget();
      morphFrame = window.requestAnimationFrame(() => {
        morphFrame = window.requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          document.documentElement.classList.remove("landing-splash-pending");
          removeLandingSplashBootStyle();
          setPhase("morphing");
          finishTimer = window.setTimeout(
            () => {
              writeLandingSplashPlayFlag(false);
              removeLandingSplashBootStyle();
              document.documentElement.classList.remove(
                "landing-splash-pending",
                "landing-splash-active",
              );
              setPhase("done");
            },
            reducedMotion ? 180 : LANDING_SPLASH_MORPH_MS,
          );
        });
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(morphFrame);
      window.clearTimeout(finishTimer);
      document.documentElement.classList.remove("landing-splash-active");
    };
  }, []);

  if (phase === "done") {
    return null;
  }

  const splash = (
    <div
      className={[
        "landing-splash",
        phase === "morphing" ? "landing-splash--morphing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--landing-splash-target-x": `${target.x}px`,
          "--landing-splash-target-y": `${target.y}px`,
          "--landing-splash-target-radius": `${target.radius}px`,
          "--landing-splash-cover-x": `${cover.dx}px`,
          "--landing-splash-cover-y": `${cover.dy}px`,
          "--landing-splash-cover-scale": `${cover.scale}`,
        } as CSSProperties
      }
      role="status"
      aria-label="Landing page loading"
    >
      <span className="landing-splash__disk" aria-hidden="true" />
      <span className="landing-splash__wordmark">sensibility</span>
    </div>
  );

  return isMounted ? createPortal(splash, document.body) : splash;
}
