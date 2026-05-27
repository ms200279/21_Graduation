"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Projects", href: "/projectspage" },
  { label: "People", href: "/peoplepage" },
  { label: "Showroom", href: "/showroompage" },
  { label: "Credits", href: "/creditspage" },
];

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const MOBILE_PAGE_PILL_HORIZONTAL_PADDING = 28;

const orbMotionDuration = 700;
const orbReturnHoldDelay = 140;
const transitionDuration = orbMotionDuration;
const transitionSettleDelay = 180;
const orbEase = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const orbOutsideTransform = "translate(var(--landing-orb-offset), -50%)";
const orbInsideTransform =
  "translate(calc((var(--orb-size) / 2) - (var(--collapsed-header-width) / 2)), -50%)";
const transitionEaseClassName =
  "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const headerShadowClassName = "shadow-[0_12px_40px_rgba(0,0,0,0.18)]";
const movingLabelClassName = [
  "pointer-events-none absolute left-1/2 top-1/2 z-10 leading-none text-white",
  "transition-transform",
  transitionEaseClassName,
  "text-[14px] md:text-[18px] lg:text-[20px]",
].join(" ");

const siteLogoIconPath = "/icons/favicon.svg";

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

function SiteLogoIcon({ className = "" }: { className?: string }) {
  return (
    <Image
      src={siteLogoIconPath}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      unoptimized
      className={[
        "h-[calc(var(--orb-size)*0.416)] w-[calc(var(--orb-size)*0.416)] object-contain",
        "brightness-0 invert transition-opacity",
        transitionEaseClassName,
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
  const orbRef = useRef<HTMLSpanElement>(null);
  const mobilePillMeasureRef = useRef<HTMLSpanElement>(null);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousPathnameRef = useRef(pathname);
  const isMobile = useIsMobile();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
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

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    activeTransitionRef.current = activeTransition;
  }, [activeTransition]);

  const isLandingPage = pathname === "/";
  const currentItemIndex = navItems.findIndex((item) => item.href === pathname);
  const currentItem = currentItemIndex >= 0 ? navItems[currentItemIndex] : null;
  const isForwardShrinking = activeTransition?.phase === "forward";
  const isReturnAbsorbed = activeTransition?.phase === "return";
  const isTransitionActive = activeTransition !== null;
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
      : "w-[var(--header-width)] px-[var(--header-padding-x)]"
    : isForwardShrinking
      ? "w-[var(--collapsed-header-width)] px-0"
      : "w-[var(--collapsed-header-width)] px-0 md:group-hover:w-[var(--header-width)] md:group-hover:px-[var(--header-padding-x)]";

  const mobileNavSizeClassName = isTransitionActive
    ? "w-[var(--mobile-page-pill-width)] px-3"
    : isMobileExpanded
      ? "w-[var(--header-width)] px-4"
      : isLandingPage
        ? "w-[var(--collapsed-header-width)] px-0"
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

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
      href: "/",
      label: "",
      fromOffset: 0,
      toOffset: 0,
      isAtRest: true,
      phase: "return",
    });
  }, []);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.push("/");
  };

  const isDesktopOrbExpanded = shouldShowDesktopLandingOrbOutside;
  const isDesktopOrbVisible =
    !isMobile &&
    (isDesktopOrbExpanded ||
      (isLandingPage && isForwardShrinking) ||
      isReturnAbsorbed);
  const isDesktopOrbInteractive = isDesktopOrbExpanded && !isTransitionActive;

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
          ref={orbRef}
          className={[
            "pointer-events-none absolute left-1/2 top-1/2 z-10",
            "h-[var(--orb-size)] w-[var(--orb-size)]",
          ].join(" ")}
          style={{
            transform: isDesktopOrbExpanded
              ? orbOutsideTransform
              : orbInsideTransform,
            opacity: isDesktopOrbVisible ? 1 : 0,
            transition: orbTransitionEnabled
              ? `transform ${orbMotionDuration}ms ${orbEase}, opacity ${orbMotionDuration}ms ${orbEase}`
              : "none",
          }}
        >
          <button
            type="button"
            aria-label={isLandingPage ? "페이지 최상단으로 이동" : "홈으로 이동"}
            onClick={handleOrbClick}
            tabIndex={isDesktopOrbInteractive ? 0 : -1}
            className={[
              "flex h-full w-full items-center justify-center rounded-full bg-black",
              headerShadowClassName,
              "touch-manipulation",
              isDesktopOrbInteractive
                ? "pointer-events-auto"
                : "pointer-events-none",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
            ].join(" ")}
          >
            {shouldShowDesktopLandingOrbOutside || isReturnAbsorbed ? (
              <SiteLogoIcon
                className={
                  shouldShowDesktopLandingOrbOutside ? "" : "opacity-0"
                }
              />
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
          "dynamic-header relative flex items-center justify-center bg-black",
          isMobile ? "h-[44px]" : "h-[var(--header-height)]",
          "overflow-hidden",
          headerShadowClassName,
          "transition-[width,padding]",
          transitionEaseClassName,
          navShapeClassName,
          navSizeClassName,
          isMobile ? "ml-auto origin-right touch-manipulation" : "",
        ].join(" ")}
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
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[14px] leading-none text-white">
            {currentItem.label}
          </span>
        ) : null}

        {showDesktopCurrentLabel ? (
          <span
            className={[
              "pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
              "text-[18px] leading-none text-white transition-transform lg:text-[20px]",
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
            navButtonsHidden ? "pointer-events-none opacity-0" : "",
          ].join(" ")}
        >
          {navItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={(event) => handleNavClick(item, event.currentTarget)}
              className={[
                "max-lg:w-full lg:w-auto text-center leading-none touch-manipulation",
                "transition-[color,opacity,transform]",
                transitionEaseClassName,
                "text-[14px] md:text-[18px] lg:text-[20px]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                item.href === pathname
                  ? "text-white"
                  : "text-[#999999] md:hover:text-white",
                isLandingPage || isMobileExpanded ? "opacity-100" : "",
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
