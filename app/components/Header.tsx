"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Projects", href: "/projectspage" },
  { label: "People", href: "/peoplepage" },
  { label: "Showroom", href: "/showroompage" },
  { label: "Credits", href: "/creditspage" },
];

const transitionDuration = 720;

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
    startOffset: number;
    isCentered: boolean;
  } | null>(null);
  const [isHoverExpansionLocked, setIsHoverExpansionLocked] = useState(false);
  const isLandingPage = pathname === "/";
  const currentItem = navItems.find((item) => item.href === pathname);
  const isShrinking = activeTransition !== null;
  const shouldShowCollapsedLabel =
    !isLandingPage && currentItem && !isShrinking;
  const canExpandOnHover = !isShrinking && !isHoverExpansionLocked;

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
      startOffset: buttonCenter - navCenter,
      isCentered: false,
    });
    setIsHoverExpansionLocked(true);

    animationFrameRef.current = requestAnimationFrame(() => {
      setActiveTransition((transition) =>
        transition?.href === item.href
          ? { ...transition, isCentered: true }
          : transition,
      );
    });

    routeTimerRef.current = setTimeout(() => {
      router.push(item.href);
    }, transitionDuration);

    resetTimerRef.current = setTimeout(() => {
      setActiveTransition(null);
    }, transitionDuration + 180);
  };

  return (
    <header className="fixed left-1/2 top-10 z-50 -translate-x-1/2">
      <nav
        ref={navRef}
        aria-label="Primary navigation"
        onMouseLeave={() => setIsHoverExpansionLocked(false)}
        className={[
          "dynamic-header group flex h-[50px] items-center justify-center rounded-[25px] bg-black",
          "overflow-hidden px-[26px] shadow-[0_12px_40px_rgba(0,0,0,0.18)]",
          "transition-[width,padding] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isLandingPage && !isShrinking
            ? "w-[min(379px,calc(100vw-32px))]"
            : [
                "w-[120px] px-0",
                canExpandOnHover
                  ? "hover:w-[min(379px,calc(100vw-32px))] hover:px-[26px]"
                  : "",
              ].join(" "),
        ].join(" ")}
      >
        {activeTransition ? (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 text-[20px] leading-none text-white transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              transform: `translate(calc(-50% + ${
                activeTransition.isCentered
                  ? "0px"
                  : `${activeTransition.startOffset}px`
              }), -50%)`,
            }}
          >
            {activeTransition.label}
          </span>
        ) : null}
        {shouldShowCollapsedLabel ? (
          <span
            className={[
              "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[20px] leading-none text-white transition-opacity duration-200",
              canExpandOnHover ? "group-hover:opacity-0" : "",
            ].join(" ")}
          >
            {currentItem.label}
          </span>
        ) : null}
        <div
          className={[
            "flex items-center justify-center gap-[30px] whitespace-nowrap",
            "transition-opacity duration-300",
            isLandingPage && !isShrinking
              ? "opacity-100 delay-500"
              : [
                  "opacity-0 delay-0",
                  canExpandOnHover
                    ? "group-hover:opacity-100 group-hover:delay-500"
                    : "duration-0 pointer-events-none",
                ].join(" "),
          ].join(" ")}
        >
          {navItems.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={(event) => handleNavClick(item, event.currentTarget)}
              className={[
                "text-[20px] leading-none text-white",
                "transition-opacity duration-300",
                "hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white",
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
