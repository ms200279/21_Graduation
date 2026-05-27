"use client";

import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Projects", href: "/projectspage" },
  { label: "People", href: "/peoplepage" },
  { label: "Showroom", href: "/showroompage" },
  { label: "Credits", href: "/creditspage" },
];

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const MOBILE_PAGE_PILL_HORIZONTAL_PADDING = 28;

const transitionDuration = 720;
const transitionSettleDelay = 180;
const transitionEaseClassName =
  "duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const headerShadowClassName = "shadow-[0_12px_40px_rgba(0,0,0,0.18)]";
const movingLabelClassName = [
  "pointer-events-none absolute left-1/2 top-1/2 z-10 leading-none text-white",
  "transition-transform",
  transitionEaseClassName,
  "text-[14px] md:text-[18px] lg:text-[20px]",
].join(" ");

const mobileHeaderStyle = {
  "--header-width": "min(300px, calc(100vw - 32px))",
  "--header-inner-width": "calc(var(--header-width) - 40px)",
  "--collapsed-header-width": "44px",
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

function MenuIcon() {
  return (
    <span className="flex flex-col items-center justify-center gap-[4px]" aria-hidden>
      <span className="block h-[2px] w-[14px] rounded-full bg-white" />
      <span className="block h-[2px] w-[14px] rounded-full bg-white" />
      <span className="block h-[2px] w-[14px] rounded-full bg-white" />
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobilePillMeasureRef = useRef<HTMLSpanElement>(null);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const [mobilePagePillWidth, setMobilePagePillWidth] = useState(112);
  const [activeTransition, setActiveTransition] = useState<{
    href: string;
    label: string;
    fromOffset: number;
    toOffset: number;
    isAtRest: boolean;
  } | null>(null);

  const isLandingPage = pathname === "/";
  const currentItemIndex = navItems.findIndex((item) => item.href === pathname);
  const currentItem = currentItemIndex >= 0 ? navItems[currentItemIndex] : null;
  const isShrinking = activeTransition !== null;
  const isMobileMenuOpen =
    isMobile && mobileMenuPath === pathname && !isShrinking;
  const isMobileExpanded = isMobileMenuOpen;

  const shouldShowDesktopLandingOrbOutside =
    !isMobile && isLandingPage && !isShrinking;

  const mobilePillMeasureLabel =
    activeTransition?.label ?? currentItem?.label ?? navItems[0].label;

  const desktopNavSizeClassName = isLandingPage
    ? isShrinking
      ? "w-[var(--collapsed-header-width)] px-0"
      : "w-[var(--header-width)] px-[var(--header-padding-x)]"
    : isShrinking
      ? "w-[var(--collapsed-header-width)] px-0"
      : "w-[var(--collapsed-header-width)] px-0 md:group-hover:w-[var(--header-width)] md:group-hover:px-[var(--header-padding-x)]";

  const mobileNavSizeClassName = isShrinking
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
    ? isLandingPage && !isMobileExpanded && !isShrinking
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

  const handleMobileHeaderTap = () => {
    if (!isMobile || isShrinking || isMobileMenuOpen) {
      return;
    }

    const nav = navRef.current;

    if (nav) {
      void nav.offsetWidth;
    }

    setMobileMenuPath(pathname);
  };

  const handleNavClick = (
    item: (typeof navItems)[number],
    button: HTMLButtonElement,
  ) => {
    if (item.href === pathname || isShrinking) {
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

    setActiveTransition({
      href: item.href,
      label: item.label,
      fromOffset: buttonCenter - navCenter,
      toOffset: 0,
      isAtRest: false,
    });

    animationFrameRef.current = requestAnimationFrame(() => {
      setActiveTransition((transition) =>
        transition?.href === item.href
          ? { ...transition, isAtRest: true }
          : transition,
      );
    });

    routeTimerRef.current = setTimeout(() => {
      router.push(item.href);
    }, transitionDuration);

    resetTimerRef.current = setTimeout(() => {
      setActiveTransition(null);
    }, transitionDuration + transitionSettleDelay);
  };

  const showMobileCurrentLabel =
    isMobile &&
    !isLandingPage &&
    !isShrinking &&
    !isMobileMenuOpen &&
    currentItem;

  const showDesktopCurrentLabel =
    !isMobile && !isLandingPage && !isShrinking && currentItem;

  const navButtonsHidden =
    isShrinking ||
    (isMobile && isLandingPage && !isMobileExpanded) ||
    (isMobile && !isLandingPage && !isMobileExpanded);

  return (
    <header
      ref={headerRef}
      className={[
        "desktop-header group fixed z-50 flex",
        isMobile
          ? "right-4 top-4 max-w-[calc(100vw-32px)] justify-end"
          : "left-1/2 top-10 h-[var(--header-height)] w-[var(--header-width)] -translate-x-1/2 items-center justify-center",
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
          aria-hidden="true"
          className={[
            "pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-black",
            "h-[var(--orb-size)] w-[var(--orb-size)]",
            headerShadowClassName,
            "transition-transform",
            transitionEaseClassName,
            shouldShowDesktopLandingOrbOutside
              ? "translate-x-[var(--landing-orb-offset)] -translate-y-1/2"
              : "-translate-x-[calc(var(--collapsed-header-width)/2-var(--orb-size)/2)] -translate-y-1/2",
          ].join(" ")}
        />
      ) : null}

      <nav
        ref={navRef}
        aria-label="Primary navigation"
        aria-expanded={isMobile ? isMobileExpanded : undefined}
        onClick={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isShrinking
            ? handleMobileHeaderTap
            : undefined
        }
        onKeyDown={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isShrinking
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleMobileHeaderTap();
                }
              }
            : undefined
        }
        role={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isShrinking
            ? "button"
            : undefined
        }
        tabIndex={
          isMobile && !isLandingPage && !isMobileMenuOpen && !isShrinking
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
        {isMobile && isLandingPage && !isMobileExpanded && !isShrinking ? (
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
            <MenuIcon />
          </button>
        ) : null}

        {activeTransition ? (
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
                "max-lg:w-full lg:w-auto text-center leading-none text-white touch-manipulation",
                "transition-[opacity,transform]",
                transitionEaseClassName,
                "text-[14px] md:text-[18px] lg:text-[20px]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
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
