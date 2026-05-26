"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Projects", href: "/projectspage" },
  { label: "People", href: "/peoplepage" },
  { label: "Showroom", href: "/showroompage" },
  { label: "Credits", href: "/creditspage" },
];

const transitionDuration = 720;
const transitionSettleDelay = 180;
const headerShadowClassName = "shadow-[0_12px_40px_rgba(0,0,0,0.18)]";
const movingLabelClassName =
  "pointer-events-none absolute left-1/2 top-1/2 z-10 text-[20px] leading-none text-white transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
const headerStyle = {
  "--header-width": "min(399px, calc(100vw - 32px))",
  "--header-inner-width": "calc(var(--header-width) - 52px)",
  "--collapsed-header-width": "120px",
  "--landing-orb-offset": "calc((var(--header-width) / -2) - 60px)",
} as CSSProperties;

const expandedTextLayoutClassName =
  "flex w-full items-center justify-between gap-[20px] whitespace-nowrap";

const currentLabelOffsets = [
  "calc(var(--header-inner-width) * -0.385)",
  "calc(var(--header-inner-width) * -0.135)",
  "calc(var(--header-inner-width) * 0.135)",
  "calc(var(--header-inner-width) * 0.385)",
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
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
  const navSizeClassName = isLandingPage
    ? isShrinking
      ? "w-[var(--collapsed-header-width)] px-0"
      : "w-[var(--header-width)] px-[26px]"
    : isShrinking
      ? "w-[var(--collapsed-header-width)] px-0"
      : "w-[var(--collapsed-header-width)] px-0 group-hover:w-[var(--header-width)] group-hover:px-[26px]";
  const shouldShowLandingOrbOutside = isLandingPage && !isShrinking;

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

  const handleNavClick = (
    item: (typeof navItems)[number],
    button: HTMLButtonElement,
  ) => {
    if (item.href === pathname || isShrinking) {
      return;
    }

    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
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

  return (
    <header
      className="group fixed left-1/2 top-10 z-50 flex h-[50px] w-[var(--header-width)] -translate-x-1/2 items-center justify-center"
      style={headerStyle}
    >
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute left-1/2 top-1/2 h-[50px] w-[50px] rounded-full bg-black",
          headerShadowClassName,
          "transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          shouldShowLandingOrbOutside
            ? "translate-x-[var(--landing-orb-offset)] -translate-y-1/2"
            : "-translate-x-[calc(var(--collapsed-header-width)/2-25px)] -translate-y-1/2",
        ].join(" ")}
      />
      <nav
        ref={navRef}
        aria-label="Primary navigation"
        className={[
          "dynamic-header flex h-[50px] items-center justify-center rounded-[25px] bg-black",
          "overflow-hidden",
          headerShadowClassName,
          "transition-[width,padding] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          navSizeClassName,
        ].join(" ")}
      >
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
        {!isLandingPage && !isShrinking && currentItem ? (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-[20px] leading-none text-white transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-[calc(-50%+var(--current-label-offset))]"
            style={
              {
                "--current-label-offset": currentLabelOffsets[currentItemIndex],
              } as CSSProperties
            }
          >
            {currentItem.label}
          </span>
        ) : null}
        <div
          className={[
            expandedTextLayoutClassName,
            isShrinking ? "pointer-events-none opacity-0" : "",
          ].join(" ")}
        >
          {navItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={(event) => handleNavClick(item, event.currentTarget)}
              className={[
                "text-center text-[20px] leading-none text-white",
                "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
                isLandingPage ? "opacity-100" : "",
                !isLandingPage && currentItem?.href === item.href
                  ? "opacity-0"
                  : "",
                !isLandingPage && currentItem?.href !== item.href
                  ? "scale-x-95 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
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
