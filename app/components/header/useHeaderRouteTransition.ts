"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { SITE_PATHS } from "@/app/utils/routes";

const ORB_MOTION_DURATION_MS = 700;
const ORB_RETURN_HOLD_DELAY_MS = 140;
const TRANSITION_SETTLE_DELAY_MS = 180;

export type HeaderRouteTransition = {
  href: string;
  label: string;
  fromOffset: number;
  toOffset: number;
  isAtRest: boolean;
  phase: "forward" | "return";
};

export function useHeaderRouteTransition({
  pathname,
  navigate,
  orbElement,
  navElement,
  setOrbTransitionEnabled,
}: {
  pathname: string;
  navigate: (href: string) => void;
  orbElement: () => HTMLElement | null;
  navElement: () => HTMLElement | null;
  setOrbTransitionEnabled: (enabled: boolean) => void;
}) {
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTransition, setActiveTransition] =
    useState<HeaderRouteTransition | null>(null);
  const activeTransitionRef = useRef(activeTransition);

  useEffect(() => {
    activeTransitionRef.current = activeTransition;
  }, [activeTransition]);

  const clearTimers = useCallback(() => {
    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (
      !activeTransition ||
      activeTransition.phase === "return" ||
      pathname !== activeTransition.href
    ) {
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      setActiveTransition(null);
    }, TRANSITION_SETTLE_DELAY_MS);

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [activeTransition, pathname]);

  const forwardOrbHoldKey =
    activeTransition?.phase === "forward" && !activeTransition.isAtRest
      ? activeTransition.href
      : null;
  const returnOrbHoldKey =
    activeTransition?.phase === "return" ? "returning" : null;

  useLayoutEffect(() => {
    if (!forwardOrbHoldKey) {
      return;
    }

    const startFrame = requestAnimationFrame(() => {
      const orbNode = orbElement();
      const navNode = navElement();

      if (orbNode) {
        void orbNode.offsetWidth;
      }

      if (navNode) {
        void navNode.offsetWidth;
      }

      setOrbTransitionEnabled(true);

      setActiveTransition((transition) =>
        transition?.phase === "forward" && !transition.isAtRest
          ? { ...transition, isAtRest: true }
          : transition,
      );
    });

    return () => {
      cancelAnimationFrame(startFrame);
    };
  }, [
    forwardOrbHoldKey,
    navElement,
    orbElement,
    setOrbTransitionEnabled,
  ]);

  useLayoutEffect(() => {
    if (!returnOrbHoldKey) {
      return;
    }

    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const startFrame = requestAnimationFrame(() => {
      const orbNode = orbElement();
      const navNode = navElement();

      if (orbNode) {
        void orbNode.offsetWidth;
      }

      if (navNode) {
        void navNode.offsetWidth;
      }

      setOrbTransitionEnabled(true);

      delayTimer = setTimeout(() => {
        setActiveTransition(null);
      }, ORB_RETURN_HOLD_DELAY_MS);
    });

    return () => {
      cancelAnimationFrame(startFrame);

      if (delayTimer) {
        clearTimeout(delayTimer);
      }
    };
  }, [
    navElement,
    orbElement,
    returnOrbHoldKey,
    setOrbTransitionEnabled,
  ]);

  const beginForward = useCallback(
    ({
      href,
      label,
      fromOffset,
    }: Pick<HeaderRouteTransition, "href" | "label" | "fromOffset">) => {
      clearTimers();
      setOrbTransitionEnabled(false);
      setActiveTransition({
        href,
        label,
        fromOffset,
        toOffset: 0,
        isAtRest: false,
        phase: "forward",
      });

      routeTimerRef.current = setTimeout(() => {
        navigate(href);
      }, ORB_MOTION_DURATION_MS);
    },
    [clearTimers, navigate, setOrbTransitionEnabled],
  );

  const beginReturn = useCallback(() => {
    const currentTransition = activeTransitionRef.current;

    if (
      currentTransition?.phase === "return" ||
      currentTransition?.phase === "forward"
    ) {
      return false;
    }

    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
      routeTimerRef.current = null;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setOrbTransitionEnabled(false);
    setActiveTransition({
      href: SITE_PATHS.landing,
      label: "",
      fromOffset: 0,
      toOffset: 0,
      isAtRest: true,
      phase: "return",
    });

    return true;
  }, [setOrbTransitionEnabled]);

  return {
    activeTransition,
    activeTransitionRef,
    beginForward,
    beginReturn,
    isTransitionActive: activeTransition !== null,
  };
}
