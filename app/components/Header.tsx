"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LANDING_HEADER_NAV_LIQUID_GLASS_OPTIONS,
  LANDING_INFO_LIQUID_GLASS_OPTIONS,
  useLiquidGlass,
} from "./liquid-glass";
import {
  LANDING_SCROLL_INTENT_EVENT,
  LANDING_SCROLL_PROGRESS_EVENT,
  clearLandingScrollDepthOnLeave,
  getLandingScrollDepthOnLeave,
  getLandingScrollGestureMaxProgress,
  getLandingScrollSectionProgress,
  landingScrollConceptThreshold,
  landingScrollHeaderExpandMaxProgress,
  landingScrollMediaThreshold,
  recordLandingScrollDepthOnLeave,
  resetLandingScrollGestureForOrbHome,
  scrollLandingFullpageTo,
} from "./LandingScrollExperience";

const navItems = [
  { label: "Projects", href: "/projectspage" },
  { label: "People", href: "/peoplepage" },
  { label: "Showroom", href: "/showroompage" },
  { label: "Credits", href: "/creditspage" },
];

function isNavItemPath(itemHref: string, pathname: string) {
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const MOBILE_PAGE_PILL_HORIZONTAL_PADDING = 28;

const orbMotionDuration = 700;
const labelMotionDuration = Math.round(orbMotionDuration * 0.38);
const orbReturnHoldDelay = 140;
const transitionDuration = orbMotionDuration;
const transitionSettleDelay = 180;
const landingScrollCollapseThreshold = 0.02;
/** Header orb animation only runs in the landing ↔ concept scroll zone (scrollProgress 0–1). */
const landingScrollPastConceptThreshold = landingScrollConceptThreshold;
const orbEase = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const labelEase = orbEase;
const orbOutsideTransform = "translate(var(--landing-orb-offset), -50%)";
const orbInsideTransform =
  "translate(calc((var(--orb-size) / 2) - (var(--collapsed-header-width) / 2)), -50%)";
const orbScrollCollapsedTransform = "translate(-50%, -50%)";
const transitionEaseClassName =
  "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const movingLabelClassName = [
  "pointer-events-none absolute left-1/2 top-1/2 z-10 leading-none font-bold text-systemNavy",
  "transition-[color,transform]",
  transitionEaseClassName,
  "text-[14px] md:text-[20px]",
].join(" ");

const siteLogoIconPath = "/icons/symbol.svg";

function measureOrbCenterDeltaPx(
  orbElement: HTMLElement,
  headerElement: HTMLElement,
  transform: string,
) {
  const previousTransform = orbElement.style.transform;
  const previousTransition = orbElement.style.transition;

  orbElement.style.transition = "none";
  orbElement.style.transform = transform;
  void orbElement.offsetWidth;

  const headerRect = headerElement.getBoundingClientRect();
  const headerCenterX = headerRect.left + headerRect.width / 2;
  const orbRect = orbElement.getBoundingClientRect();
  const orbCenterX = orbRect.left + orbRect.width / 2;

  orbElement.style.transform = previousTransform;
  orbElement.style.transition = previousTransition;

  return orbCenterX - headerCenterX;
}

const mobileHeaderStyle = {
  "--header-width": "min(300px, calc(100vw - 32px))",
  "--header-inner-width": "calc(var(--header-width) - 40px)",
  "--collapsed-header-width": "44px",
  "--orb-size": "44px",
  "--landing-orb-offset": "0px",
} as CSSProperties;

const mobileExpandedNavListClassName =
  "flex w-full items-center justify-between gap-[12px] whitespace-nowrap";

const desktopExpandedNavListClassName =
  "w-full whitespace-nowrap max-lg:grid max-lg:grid-cols-4 max-lg:items-center lg:flex lg:items-center lg:justify-between lg:gap-[20px]";

const inactiveNavLabelClassName = [
  "text-systemNavy/55 hover:text-systemNavy",
  "hover:[text-shadow:0.03em_0_0_currentColor,-0.03em_0_0_currentColor]",
  "md:hover:[text-shadow:0.03em_0_0_currentColor,-0.03em_0_0_currentColor]",
].join(" ");

const showroomInactiveNavLabelClassName = [
  "text-white/60 hover:text-white",
  "hover:[text-shadow:0.03em_0_0_currentColor,-0.03em_0_0_currentColor]",
  "md:hover:[text-shadow:0.03em_0_0_currentColor,-0.03em_0_0_currentColor]",
].join(" ");

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

    const updateIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);

    return () => {
      mediaQuery.removeEventListener("change", updateIsMobile);
    };
  }, []);

  return isMobile;
}

function SiteLogoIcon({
  className = "",
  style,
  disableTransition = false,
}: {
  className?: string;
  style?: CSSProperties;
  disableTransition?: boolean;
}) {
  return (
    <Image
      src={siteLogoIconPath}
      alt=""
      aria-hidden="true"
      width={177}
      height={299}
      unoptimized
      style={style}
      className={[
        "block h-[calc(var(--orb-size)*0.48)] w-[calc(var(--orb-size)*0.284)] object-contain object-center",
        "translate-y-[1px]",
        disableTransition ? "" : "transition-opacity",
        disableTransition ? "" : transitionEaseClassName,
        className,
      ].join(" ")}
    />
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);

  useLiquidGlass(navRef, LANDING_HEADER_NAV_LIQUID_GLASS_OPTIONS);
  useLiquidGlass(orbRef, {
    ...LANDING_INFO_LIQUID_GLASS_OPTIONS,
    saturate: 1.08,
    mountKey: pathname,
  });
  const mobilePillMeasureRef = useRef<HTMLSpanElement>(null);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousPathnameRef = useRef(pathname);
  const isMobile = useIsMobile();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const mobileMenuPathRef = useRef<string | null>(null);
  const [mobilePagePillWidth, setMobilePagePillWidth] = useState(112);
  const [orbTransitionEnabled, setOrbTransitionEnabled] = useState(true);
  const [activeTransition, setActiveTransition] = useState<{
    href: string;
    label: string;
    fromOffset: number;
    toOffset: number;
    isAtRest: boolean;
    phase: "forward" | "return";
  } | null>(null);
  const pathnameRef = useRef(pathname);
  const activeTransitionRef = useRef(activeTransition);
  const landingScrollCollapsedRef = useRef(false);
  const landingCollapseStartedAtRef = useRef<number | null>(null);
  const landingScrollAnimationRef = useRef<{
    startFrame: number;
    enableFrame: number;
    settleFrame: number;
    hideTimer: ReturnType<typeof setTimeout> | null;
  }>({
    startFrame: 0,
    enableFrame: 0,
    settleFrame: 0,
    hideTimer: null,
  });
  const isTransitionActiveRef = useRef(false);
  const isMobileRef = useRef(false);
  const landingScrollDirectionRef = useRef<"up" | "down">("down");
  const previousLandingScrollProgressRef = useRef(0);
  const previousLandingScrollScrollProgressRef = useRef(0);
  const landingScrollGestureMaxProgressRef = useRef(0);
  const landingScrollOrbHomeActiveRef = useRef(false);
  const [landingScrollCollapsed, setLandingScrollCollapsed] = useState(false);
  const [landingLabelsCollapsed, setLandingLabelsCollapsed] = useState(false);
  const [landingOrbOutsideDeltaPx, setLandingOrbOutsideDeltaPx] = useState(0);
  const [returnNavElevated, setReturnNavElevated] = useState(false);
  const [navLabelViewportOffsets, setNavLabelViewportOffsets] = useState<number[]>(
    [],
  );
  const landingScrollProgressRef = useRef(0);

  useEffect(() => {
    mobileMenuPathRef.current = mobileMenuPath;
  }, [mobileMenuPath]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    activeTransitionRef.current = activeTransition;
    isTransitionActiveRef.current = activeTransition !== null;
  }, [activeTransition]);

  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const isLandingPage = pathname === "/";
  const isShowroomPage =
    pathname === "/showroompage" || pathname.startsWith("/showroompage/");
  const currentItemIndex = navItems.findIndex((item) =>
    isNavItemPath(item.href, pathname),
  );
  const currentItem = currentItemIndex >= 0 ? navItems[currentItemIndex] : null;
  const isForwardShrinking = activeTransition?.phase === "forward";
  const isReturnAbsorbed = activeTransition?.phase === "return";
  const isTransitionActive = activeTransition !== null;
  const isLandingScrollCollapsed =
    isLandingPage && landingScrollCollapsed && !isTransitionActive;
  const isMobileMenuOpen =
    isMobile && mobileMenuPath === pathname && !isTransitionActive;
  const isMobileExpanded = isMobileMenuOpen;

  const shouldShowDesktopLandingOrbOutside =
    !isMobile &&
    isLandingPage &&
    !isReturnAbsorbed &&
    (!isForwardShrinking || !activeTransition?.isAtRest);

  const mobilePillMeasureLabel =
    activeTransition?.phase === "forward"
      ? activeTransition.label
      : (currentItem?.label ?? navItems[0].label);

  const desktopNavSizeClassName = isLandingPage
    ? isForwardShrinking || isReturnAbsorbed
      ? "w-[var(--collapsed-header-width)] px-0"
      : isLandingScrollCollapsed
        ? "w-[var(--orb-size)] px-0"
        : "w-[var(--header-width)] px-[var(--header-padding-x)]"
    : isForwardShrinking
      ? "w-[var(--collapsed-header-width)] px-0"
      : "w-[var(--collapsed-header-width)] px-0 md:group-hover:w-[var(--header-width)] md:group-hover:px-[var(--header-padding-x)]";

  const mobileNavSizeClassName = isTransitionActive
    ? "w-[var(--mobile-page-pill-width)] px-3"
    : isMobileExpanded
      ? "w-[var(--header-width)] px-4"
      : isLandingPage
        ? isLandingScrollCollapsed
          ? "w-[var(--collapsed-header-width)] px-0"
          : "w-[var(--collapsed-header-width)] px-0"
        : "w-[var(--mobile-page-pill-width)] px-3";

  const navSizeClassName = isMobile
    ? mobileNavSizeClassName
    : desktopNavSizeClassName;

  const navShapeClassName = isMobile
    ? isLandingPage && !isMobileExpanded && !isTransitionActive
      ? "rounded-full"
      : "rounded-[22px]"
    : "rounded-[var(--header-radius)]";

  useEffect(() => {
    return () => {
      if (routeTimerRef.current) {
        clearTimeout(routeTimerRef.current);
      }

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

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
    }, transitionSettleDelay);

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [activeTransition, pathname]);

  useLayoutEffect(() => {
    if (!isMobile) {
      return;
    }

    const measureNode = mobilePillMeasureRef.current;

    if (!measureNode) {
      return;
    }

    setMobilePagePillWidth(
      measureNode.offsetWidth + MOBILE_PAGE_PILL_HORIZONTAL_PADDING,
    );
  }, [isMobile, mobilePillMeasureLabel]);

  useLayoutEffect(() => {
    if (!isLandingPage || isMobile || !orbRef.current || !headerRef.current) {
      return;
    }

    const outsideDelta = measureOrbCenterDeltaPx(
      orbRef.current,
      headerRef.current,
      orbOutsideTransform,
    );

    setLandingOrbOutsideDeltaPx(outsideDelta);
  }, [isLandingPage, isMobile]);

  const cancelLandingScrollHeaderAnimation = useCallback(() => {
    const animation = landingScrollAnimationRef.current;

    if (animation.startFrame) {
      cancelAnimationFrame(animation.startFrame);
    }

    if (animation.enableFrame) {
      cancelAnimationFrame(animation.enableFrame);
    }

    if (animation.settleFrame) {
      cancelAnimationFrame(animation.settleFrame);
    }

    if (animation.hideTimer) {
      clearTimeout(animation.hideTimer);
    }

    landingScrollAnimationRef.current = {
      startFrame: 0,
      enableFrame: 0,
      settleFrame: 0,
      hideTimer: null,
    };
  }, []);

  const runLandingScrollHeaderTransition = useCallback(
    (shouldCollapse: boolean) => {
      if (shouldCollapse === landingScrollCollapsedRef.current) {
        return;
      }

      cancelLandingScrollHeaderAnimation();
      landingScrollCollapsedRef.current = shouldCollapse;

      if (shouldCollapse) {
        landingCollapseStartedAtRef.current = performance.now();
      } else {
        landingCollapseStartedAtRef.current = null;
      }

      const startFrame = requestAnimationFrame(() => {
        setOrbTransitionEnabled(false);

        if (orbRef.current) {
          void orbRef.current.offsetWidth;
        }

        if (navRef.current) {
          void navRef.current.offsetWidth;
        }

        const settleFrame = requestAnimationFrame(() => {
          setOrbTransitionEnabled(true);
          setLandingScrollCollapsed(shouldCollapse);
          setLandingLabelsCollapsed(shouldCollapse);
        });

        landingScrollAnimationRef.current.settleFrame = settleFrame;
      });

      landingScrollAnimationRef.current.startFrame = startFrame;
    },
    [cancelLandingScrollHeaderAnimation],
  );

  const setLandingScrollHeaderCollapsedInstant = useCallback(
    (shouldCollapse: boolean) => {
      if (shouldCollapse === landingScrollCollapsedRef.current) {
        return;
      }

      cancelLandingScrollHeaderAnimation();
      landingScrollCollapsedRef.current = shouldCollapse;

      if (shouldCollapse) {
        landingCollapseStartedAtRef.current = performance.now();
      } else {
        landingCollapseStartedAtRef.current = null;
      }

      setOrbTransitionEnabled(false);
      setLandingScrollCollapsed(shouldCollapse);
      setLandingLabelsCollapsed(shouldCollapse);

      requestAnimationFrame(() => {
        setOrbTransitionEnabled(true);
      });
    },
    [cancelLandingScrollHeaderAnimation],
  );

  const gestureIncludesMediaTravel = useCallback(
    (maxScrollProgressInGesture: number) =>
      maxScrollProgressInGesture > landingScrollHeaderExpandMaxProgress,
    [],
  );

  const isAtOrPastConceptSection = useCallback(
    (scrollProgress: number) =>
      scrollProgress >= landingScrollPastConceptThreshold,
    [],
  );

  const syncLandingScrollHeaderFromProgress = useCallback(
    (
      progress: number,
      scrollProgress = progress,
      maxScrollProgressInGesture = landingScrollGestureMaxProgressRef.current,
    ) => {
      if (
        pathnameRef.current !== "/" ||
        isMobileRef.current ||
        isTransitionActiveRef.current
      ) {
        return;
      }

      landingScrollGestureMaxProgressRef.current = maxScrollProgressInGesture;

      const previousScrollProgress =
        previousLandingScrollScrollProgressRef.current;
      let direction = landingScrollDirectionRef.current;

      if (scrollProgress > previousScrollProgress + 0.0001) {
        direction = "down";
      } else if (scrollProgress < previousScrollProgress - 0.0001) {
        direction = "up";
      }

      landingScrollDirectionRef.current = direction;
      previousLandingScrollProgressRef.current = progress;
      previousLandingScrollScrollProgressRef.current = scrollProgress;
      landingScrollProgressRef.current = progress;

      const includesMediaTravel = gestureIncludesMediaTravel(
        maxScrollProgressInGesture,
      );

      if (isAtOrPastConceptSection(scrollProgress)) {
        if (landingScrollOrbHomeActiveRef.current) {
          if (scrollProgress < landingScrollCollapseThreshold) {
            landingScrollOrbHomeActiveRef.current = false;
          }

          return;
        }

        if (!landingScrollCollapsedRef.current) {
          if (includesMediaTravel) {
            setLandingScrollHeaderCollapsedInstant(true);
          } else {
            runLandingScrollHeaderTransition(true);
          }
        }

        return;
      }

      if (includesMediaTravel) {
        if (landingScrollOrbHomeActiveRef.current) {
          return;
        }

        if (!landingScrollCollapsedRef.current) {
          setLandingScrollHeaderCollapsedInstant(true);
        }

        return;
      }

      const isLandingToConceptScroll =
        direction === "down" && progress > landingScrollCollapseThreshold;
      const isConceptToLandingScroll =
        direction === "up" && landingScrollCollapsedRef.current;

      if (!isLandingToConceptScroll && !isConceptToLandingScroll) {
        return;
      }

      runLandingScrollHeaderTransition(isLandingToConceptScroll);
    },
    [
      gestureIncludesMediaTravel,
      isAtOrPastConceptSection,
      runLandingScrollHeaderTransition,
      setLandingScrollHeaderCollapsedInstant,
    ],
  );

  const forceExpandLandingScrollHeaderForOrbHome = useCallback(() => {
    landingScrollOrbHomeActiveRef.current = true;
    landingScrollGestureMaxProgressRef.current = 0;
    resetLandingScrollGestureForOrbHome();
    landingScrollDirectionRef.current = "up";
    runLandingScrollHeaderTransition(false);
  }, [runLandingScrollHeaderTransition]);

  const expandLandingScrollHeader = useCallback(() => {
    const scrollProgress = previousLandingScrollScrollProgressRef.current;
    const maxScrollProgressInGesture = getLandingScrollGestureMaxProgress();
    const isAtConceptSnap =
      scrollProgress >= landingScrollPastConceptThreshold &&
      scrollProgress <= landingScrollHeaderExpandMaxProgress;

    if (!isAtConceptSnap || gestureIncludesMediaTravel(maxScrollProgressInGesture)) {
      return;
    }

    landingScrollDirectionRef.current = "up";
    runLandingScrollHeaderTransition(false);
  }, [
    gestureIncludesMediaTravel,
    runLandingScrollHeaderTransition,
  ]);

  useEffect(() => {
    let progressRaf = 0;
    let pendingProgress: {
      progress: number;
      scrollProgress: number;
      maxScrollProgressInGesture: number;
    } | null = null;

    const flushLandingScrollProgress = () => {
      progressRaf = 0;

      if (!pendingProgress) {
        return;
      }

      const { progress, scrollProgress, maxScrollProgressInGesture } =
        pendingProgress;
      pendingProgress = null;

      if (progress > 0 && mobileMenuPathRef.current !== null) {
        setMobileMenuPath(null);
      }

      if (!isLandingPage || isMobileRef.current) {
        return;
      }

      syncLandingScrollHeaderFromProgress(
        progress,
        scrollProgress,
        maxScrollProgressInGesture,
      );
    };

    const handleLandingScrollIntent = (event: Event) => {
      if (!isLandingPage || isMobileRef.current) {
        return;
      }

      const customEvent = event as CustomEvent<{ direction: "up" | "down" }>;

      if (customEvent.detail.direction === "up") {
        expandLandingScrollHeader();
      }
    };

    const handleLandingScrollProgress = (event: Event) => {
      const customEvent = event as CustomEvent<{
        progress: number;
        scrollProgress?: number;
        maxScrollProgressInGesture?: number;
      }>;

      pendingProgress = {
        progress: customEvent.detail.progress,
        scrollProgress:
          customEvent.detail.scrollProgress ?? customEvent.detail.progress,
        maxScrollProgressInGesture:
          customEvent.detail.maxScrollProgressInGesture ??
          landingScrollGestureMaxProgressRef.current,
      };

      if (!progressRaf) {
        progressRaf = requestAnimationFrame(flushLandingScrollProgress);
      }
    };

    if (isLandingPage && !isMobile) {
      syncLandingScrollHeaderFromProgress(
        landingScrollProgressRef.current,
        landingScrollProgressRef.current,
        landingScrollGestureMaxProgressRef.current,
      );
    }

    window.addEventListener(LANDING_SCROLL_INTENT_EVENT, handleLandingScrollIntent);
    window.addEventListener(LANDING_SCROLL_PROGRESS_EVENT, handleLandingScrollProgress);

    return () => {
      window.removeEventListener(
        LANDING_SCROLL_INTENT_EVENT,
        handleLandingScrollIntent,
      );
      window.removeEventListener(
        LANDING_SCROLL_PROGRESS_EVENT,
        handleLandingScrollProgress,
      );
      if (progressRaf) {
        cancelAnimationFrame(progressRaf);
      }
      cancelLandingScrollHeaderAnimation();
    };
  }, [
    isLandingPage,
    isMobile,
    syncLandingScrollHeaderFromProgress,
    expandLandingScrollHeader,
    cancelLandingScrollHeaderAnimation,
  ]);

  useEffect(() => {
    if (isLandingPage) {
      return;
    }

    landingScrollCollapsedRef.current = false;
    landingCollapseStartedAtRef.current = null;
    landingScrollDirectionRef.current = "down";
    previousLandingScrollProgressRef.current = 0;
    previousLandingScrollScrollProgressRef.current = 0;
    landingScrollGestureMaxProgressRef.current = 0;
    landingScrollOrbHomeActiveRef.current = false;
    cancelLandingScrollHeaderAnimation();

    const resetFrame = requestAnimationFrame(() => {
      setLandingScrollCollapsed(false);
      setLandingLabelsCollapsed(false);
      setReturnNavElevated(false);
    });

    return () => {
      cancelAnimationFrame(resetFrame);
    };
  }, [isLandingPage, cancelLandingScrollHeaderAnimation]);

  const measureNavLabelViewportOffsets = useCallback(() => {
    const nav = navRef.current;

    if (!nav || isMobile) {
      return;
    }

    const buttons = nav.querySelectorAll<HTMLButtonElement>(
      "[data-landing-nav-item]",
    );
    const viewportCenter = window.innerWidth / 2;
    const offsets = Array.from(buttons).map((button) => {
      const rect = button.getBoundingClientRect();

      return rect.left + rect.width / 2 - viewportCenter;
    });

    setNavLabelViewportOffsets(offsets);
  }, [isMobile]);

  useLayoutEffect(() => {
    if (!isLandingPage || isMobile) {
      return;
    }

    if (landingScrollCollapsed && navLabelViewportOffsets.length > 0) {
      return;
    }

    measureNavLabelViewportOffsets();
  }, [
    isLandingPage,
    isMobile,
    landingScrollCollapsed,
    measureNavLabelViewportOffsets,
    navLabelViewportOffsets.length,
  ]);

  useEffect(() => {
    if (!isLandingPage || isMobile) {
      return;
    }

    let resizeRaf = 0;
    const handleResize = () => {
      if (resizeRaf) {
        return;
      }

      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;

        const orb = orbRef.current;
        const header = headerRef.current;

        if (orb && header) {
          setLandingOrbOutsideDeltaPx(
            measureOrbCenterDeltaPx(orb, header, orbOutsideTransform),
          );
        }

        if (!landingScrollCollapsedRef.current) {
          measureNavLabelViewportOffsets();
        }
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeRaf) {
        cancelAnimationFrame(resizeRaf);
      }
    };
  }, [isLandingPage, isMobile, measureNavLabelViewportOffsets]);

  useEffect(() => {
    if (!isMobile || !isMobileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const headerNode = headerRef.current;

      if (!headerNode || headerNode.contains(event.target as Node)) {
        return;
      }

      setMobileMenuPath(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobile, isMobileMenuOpen]);

  useEffect(() => {
    const isExpanded = isMobile && isMobileMenuOpen;

    document.body.classList.toggle("mobile-header-expanded", isExpanded);

    window.dispatchEvent(
      new CustomEvent("mobile-header-expanded-change", {
        detail: { expanded: isExpanded },
      }),
    );

    return () => {
      document.body.classList.remove("mobile-header-expanded");
      window.dispatchEvent(
        new CustomEvent("mobile-header-expanded-change", {
          detail: { expanded: false },
        }),
      );
    };
  }, [isMobile, isMobileMenuOpen]);

  const clearTransitionTimers = () => {
    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const beginOrbReturnAnimation = useCallback((fromHref: string) => {
    if (fromHref === "/") {
      return;
    }

    if (activeTransitionRef.current?.phase === "return") {
      return;
    }

    if (activeTransitionRef.current?.phase === "forward") {
      return;
    }

    const depthOnLeave = getLandingScrollDepthOnLeave();
    clearLandingScrollDepthOnLeave();

    if (depthOnLeave >= landingScrollMediaThreshold) {
      cancelLandingScrollHeaderAnimation();
      landingScrollCollapsedRef.current = true;
      landingCollapseStartedAtRef.current = null;
      setLandingScrollCollapsed(true);
      setLandingLabelsCollapsed(true);
      setReturnNavElevated(false);
      return;
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

    cancelLandingScrollHeaderAnimation();

    landingScrollCollapsedRef.current = false;
    landingCollapseStartedAtRef.current = null;
    setLandingScrollCollapsed(false);
    setLandingLabelsCollapsed(false);
    setReturnNavElevated(true);

    setActiveTransition({
      href: "/",
      label: "",
      fromOffset: 0,
      toOffset: 0,
      isAtRest: true,
      phase: "return",
    });
  }, [cancelLandingScrollHeaderAnimation]);

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
      const orbNode = orbRef.current;
      const navNode = navRef.current;

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
  }, [forwardOrbHoldKey]);

  useLayoutEffect(() => {
    if (!returnOrbHoldKey) {
      return;
    }

    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const startFrame = requestAnimationFrame(() => {
      const orbNode = orbRef.current;
      const navNode = navRef.current;

      if (orbNode) {
        void orbNode.offsetWidth;
      }

      if (navNode) {
        void navNode.offsetWidth;
      }

      setOrbTransitionEnabled(true);

      delayTimer = setTimeout(() => {
        setActiveTransition(null);
      }, orbReturnHoldDelay);
    });

    return () => {
      cancelAnimationFrame(startFrame);

      if (delayTimer) {
        clearTimeout(delayTimer);
      }
    };
  }, [returnOrbHoldKey]);

  useEffect(() => {
    if (
      !isLandingPage ||
      isMobile ||
      !returnNavElevated ||
      isTransitionActive
    ) {
      return;
    }

    const lowerTimer = setTimeout(() => {
      setReturnNavElevated(false);
    }, orbMotionDuration);

    return () => {
      clearTimeout(lowerTimer);
    };
  }, [isLandingPage, isMobile, returnNavElevated, isTransitionActive]);

  useLayoutEffect(() => {
    const previousPathname = previousPathnameRef.current;

    if (
      !isMobile &&
      pathname === "/" &&
      previousPathname !== "/" &&
      activeTransition?.phase !== "return" &&
      activeTransition?.phase !== "forward"
    ) {
      beginOrbReturnAnimation(previousPathname);
    }

    previousPathnameRef.current = pathname;
  }, [pathname, isMobile, beginOrbReturnAnimation, activeTransition?.phase]);

  useEffect(() => {
    const handlePopState = () => {
      if (isMobile || window.location.pathname !== "/") {
        return;
      }

      const fromHref = pathnameRef.current;

      if (fromHref === "/") {
        return;
      }

      beginOrbReturnAnimation(fromHref);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isMobile, beginOrbReturnAnimation]);

  const handleMobileHeaderTap = () => {
    if (!isMobile || isTransitionActive || isMobileMenuOpen) {
      return;
    }

    const nav = navRef.current;

    if (nav) {
      void nav.offsetWidth;
    }

    setMobileMenuPath(pathname);
  };

  const handleOrbClick = () => {
    if (isTransitionActive) {
      return;
    }

    if (pathname === "/") {
      if (getLandingScrollSectionProgress() >= landingScrollPastConceptThreshold) {
        forceExpandLandingScrollHeaderForOrbHome();
      }

      scrollLandingFullpageTo(0);
      return;
    }

    router.push("/");
  };

  const isDesktopOrbExpanded =
    shouldShowDesktopLandingOrbOutside && !isLandingScrollCollapsed;
  const isDesktopOrbVisible =
    !isMobile &&
    (isDesktopOrbExpanded ||
      isLandingScrollCollapsed ||
      (isLandingPage && isForwardShrinking) ||
      isReturnAbsorbed);
  const isDesktopOrbInteractive =
    (isDesktopOrbExpanded || isLandingScrollCollapsed) && !isTransitionActive;

  const shouldShowLandingOrbIcon =
    shouldShowDesktopLandingOrbOutside ||
    isReturnAbsorbed ||
    isLandingScrollCollapsed;

  const landingOrbHeroTransform = `translate(calc(-50% + ${landingOrbOutsideDeltaPx}px), -50%)`;

  const desktopOrbTransform = (() => {
    if (isLandingPage && !isMobile && isReturnAbsorbed) {
      return orbInsideTransform;
    }

    if (isLandingPage && !isMobile && isForwardShrinking) {
      return activeTransition?.isAtRest
        ? orbInsideTransform
        : landingOrbHeroTransform;
    }

    if (isLandingPage && !isMobile && !isTransitionActive) {
      return isLandingScrollCollapsed
        ? orbScrollCollapsedTransform
        : landingOrbHeroTransform;
    }

    return isDesktopOrbExpanded ? orbOutsideTransform : orbInsideTransform;
  })();

  const useLandingScrollNavStyle =
    isLandingPage && !isMobile && !isTransitionActive;

  const landingScrollNavStyle: CSSProperties | undefined = useLandingScrollNavStyle
    ? {
        opacity: isLandingScrollCollapsed ? 0 : 1,
        pointerEvents: isLandingScrollCollapsed ? "none" : undefined,
        transition: orbTransitionEnabled
          ? `width ${orbMotionDuration}ms ${orbEase}, padding ${orbMotionDuration}ms ${orbEase}, opacity ${orbMotionDuration}ms ${orbEase}`
          : "none",
      }
    : undefined;

  const handleNavClick = (
    item: (typeof navItems)[number],
    button: HTMLButtonElement,
  ) => {
    if (item.href === pathname || isTransitionActive) {
      return;
    }

    clearTransitionTimers();

    if (isMobile) {
      setMobileMenuPath(null);
    }

    if (isLandingPage && !isMobile) {
      recordLandingScrollDepthOnLeave(
        previousLandingScrollScrollProgressRef.current,
      );
      cancelLandingScrollHeaderAnimation();
      landingScrollCollapsedRef.current = false;
      landingCollapseStartedAtRef.current = null;
      setLandingScrollCollapsed(false);
      setLandingLabelsCollapsed(false);
    }

    const navRect = navRef.current?.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const navCenter = navRect
      ? navRect.left + navRect.width / 2
      : window.innerWidth / 2;
    const buttonCenter = buttonRect.left + buttonRect.width / 2;

    const nav = navRef.current;

    if (nav) {
      void nav.offsetWidth;
    }

    if (orbRef.current) {
      void orbRef.current.offsetWidth;
    }

    setOrbTransitionEnabled(false);

    setActiveTransition({
      href: item.href,
      label: item.label,
      fromOffset: buttonCenter - navCenter,
      toOffset: 0,
      isAtRest: false,
      phase: "forward",
    });

    routeTimerRef.current = setTimeout(() => {
      router.push(item.href);
    }, transitionDuration);
  };

  const showMobileCurrentLabel =
    isMobile &&
    !isLandingPage &&
    !isTransitionActive &&
    !isMobileMenuOpen &&
    currentItem;

  const showDesktopCurrentLabel =
    !isMobile && !isLandingPage && !isTransitionActive && currentItem;

  const navButtonsHidden =
    isTransitionActive ||
    (isMobile && isLandingPage && !isMobileExpanded) ||
    (isMobile && !isLandingPage && !isMobileExpanded);


  return (
    <header
      ref={headerRef}
      className={[
        "desktop-header group fixed z-50 flex",
        isShowroomPage ? "showroom-header" : "",
        isMobile
          ? "right-4 top-4 max-w-[calc(100vw-32px)] justify-end"
          : "left-1/2 top-[10px] h-[var(--header-height)] w-[var(--header-width)] -translate-x-1/2 items-center justify-center",
      ].join(" ")}
      style={
        isMobile
          ? ({
              ...mobileHeaderStyle,
              "--mobile-page-pill-width": `${mobilePagePillWidth}px`,
            } as CSSProperties)
          : undefined
      }
    >
      {isMobile ? (
        <span
          ref={mobilePillMeasureRef}
          aria-hidden="true"
          className="pointer-events-none invisible absolute text-[14px] leading-none whitespace-nowrap"
        >
          {mobilePillMeasureLabel}
        </span>
      ) : null}

      {!isMobile ? (
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 z-0"
          aria-hidden="true"
        >
          <button
            ref={orbRef}
            type="button"
            aria-label={isLandingPage ? "페이지 최상단으로 이동" : "홈으로 이동"}
            onClick={handleOrbClick}
            tabIndex={isDesktopOrbInteractive ? 0 : -1}
            className={[
              "flex h-[var(--orb-size)] w-[var(--orb-size)] shrink-0 items-center justify-center",
              "landing-header-orb rounded-full liquid-glass-surface",
              "touch-manipulation",
              isDesktopOrbInteractive
                ? "pointer-events-auto"
                : "pointer-events-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
            ].join(" ")}
            style={{
              transform: desktopOrbTransform,
              opacity: isDesktopOrbVisible ? 1 : 0,
              transition:
                orbTransitionEnabled
                  ? `transform ${orbMotionDuration}ms ${orbEase}, opacity ${orbMotionDuration}ms ${orbEase}`
                  : "none",
            }}
          >
            {shouldShowLandingOrbIcon ? (
              <SiteLogoIcon />
            ) : null}
          </button>
        </span>
      ) : null}

      <nav
        ref={navRef}
        aria-label="Primary navigation"
        aria-expanded={isMobile ? isMobileExpanded : undefined}
        onClick={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isTransitionActive
            ? handleMobileHeaderTap
            : undefined
        }
        onKeyDown={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isTransitionActive
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleMobileHeaderTap();
                }
              }
            : undefined
        }
        role={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isTransitionActive
            ? "button"
            : undefined
        }
        tabIndex={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isTransitionActive
            ? 0
            : undefined
        }
        className={[
          "dynamic-header relative flex items-center justify-center liquid-glass-surface",
          isMobile ? "h-[44px]" : "h-[var(--header-height)]",
          returnNavElevated ? "z-20" : "z-10",
          "overflow-hidden",
          useLandingScrollNavStyle
            ? ""
            : "transition-[width,padding,opacity]",
          useLandingScrollNavStyle ? "" : transitionEaseClassName,
          navShapeClassName,
          navSizeClassName,
          isMobile ? "ml-auto origin-right touch-manipulation" : "",
        ].join(" ")}
        style={landingScrollNavStyle}
      >
        {isMobile && isLandingPage && !isMobileExpanded && !isTransitionActive ? (
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={isMobileExpanded}
            onClick={handleMobileHeaderTap}
            className={[
              "absolute inset-0 flex items-center justify-center rounded-full",
              "touch-manipulation focus-visible:outline focus-visible:outline-2",
              "focus-visible:outline-offset-2 focus-visible:outline-white",
            ].join(" ")}
          >
            <SiteLogoIcon />
          </button>
        ) : null}

        {activeTransition?.phase === "forward" ? (
          <span
            className={movingLabelClassName}
            style={{
              color: isShowroomPage ? "#ffffff" : undefined,
              transform: `translate(calc(-50% + ${
                activeTransition.isAtRest
                  ? `${activeTransition.toOffset}px`
                  : `${activeTransition.fromOffset}px`
              }), -50%)`,
            }}
          >
            {activeTransition.label}
          </span>
        ) : null}

        {showMobileCurrentLabel ? (
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] font-bold leading-none transition-colors ${transitionEaseClassName} ${isShowroomPage ? "text-white" : "text-systemNavy"}`}
          >
            {currentItem.label}
          </span>
        ) : null}

        {showDesktopCurrentLabel ? (
          <span
            className={[
              "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
              `text-[20px] font-bold leading-none transition-[color,transform] ${isShowroomPage ? "text-white" : "text-systemNavy"}`,
              transitionEaseClassName,
              "md:group-hover:translate-x-[calc(-50%+var(--current-label-offset))]",
            ].join(" ")}
            style={
              {
                "--current-label-offset": `var(--nav-label-offset-${currentItemIndex})`,
              } as CSSProperties
            }
          >
            {currentItem.label}
          </span>
        ) : null}

        <div
          className={[
            isMobile ? mobileExpandedNavListClassName : desktopExpandedNavListClassName,
            "landing-nav-items",
            "transition-[opacity,transform]",
            transitionEaseClassName,
            navButtonsHidden ? "pointer-events-none opacity-0" : "",
          ].join(" ")}
        >
          {navItems.map((item, index) => (
            <button
              key={item.href}
              type="button"
              data-landing-nav-item=""
              onClick={(event) => handleNavClick(item, event.currentTarget)}
              style={
                isLandingPage && !isMobile
                  ? ({
                      transform: landingLabelsCollapsed
                        ? `translateX(${-(navLabelViewportOffsets[index] ?? 0)}px)`
                        : undefined,
                      opacity: landingLabelsCollapsed ? 0 : undefined,
                      transition: `transform ${labelMotionDuration}ms ${labelEase}, opacity ${labelMotionDuration}ms ${labelEase}`,
                    } as CSSProperties)
                  : undefined
              }
              className={[
                "max-lg:w-full lg:w-auto text-center leading-none touch-manipulation",
                "transition-[color,opacity,transform,text-shadow]",
                transitionEaseClassName,
                "text-[14px] md:text-[20px]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                isNavItemPath(item.href, pathname)
                  ? isShowroomPage
                    ? "font-bold text-white"
                    : "font-bold text-systemNavy"
                  : isShowroomPage
                    ? showroomInactiveNavLabelClassName
                    : inactiveNavLabelClassName,
                (isLandingPage && !isLandingScrollCollapsed) || isMobileExpanded
                  ? "opacity-100"
                  : "",
                !isLandingPage &&
                !isMobile &&
                currentItem?.href === item.href
                  ? "opacity-0"
                  : "",
                !isLandingPage &&
                !isMobile &&
                currentItem?.href !== item.href
                  ? "scale-x-95 opacity-0 md:group-hover:scale-x-100 md:group-hover:opacity-100"
                  : "",
                !isLandingPage &&
                isMobile &&
                !isMobileExpanded &&
                currentItem?.href === item.href
                  ? "sr-only"
                  : "",
                !isLandingPage &&
                isMobile &&
                !isMobileExpanded &&
                currentItem?.href !== item.href
                  ? "hidden"
                  : "",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
