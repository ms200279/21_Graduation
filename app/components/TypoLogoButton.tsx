"use client";

import { useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { scrollLandingFullpageTo } from "./LandingScrollExperience";

const typoLogoPath = "/icons/typo.svg";
const MOBILE_HEADER_EXPANDED_EVENT = "mobile-header-expanded-change";
const LANDING_HERO_COPY_ID = "landing-hero-copy";

function subscribeToMobileHeaderExpanded(onStoreChange: () => void) {
  window.addEventListener(MOBILE_HEADER_EXPANDED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(MOBILE_HEADER_EXPANDED_EVENT, onStoreChange);
  };
}

function getMobileHeaderExpandedSnapshot() {
  return document.body.classList.contains("mobile-header-expanded");
}

function readCopyAlignedLeft() {
  const copy = document.getElementById(LANDING_HERO_COPY_ID);

  if (!copy) {
    return null;
  }

  return Math.round(copy.getBoundingClientRect().left);
}

export default function TypoLogoButton() {
  const pathname = usePathname();
  const router = useRouter();
  const isShowroomPage =
    pathname === "/showroompage" || pathname.startsWith("/showroompage/");
  const isMobileHeaderExpanded = useSyncExternalStore(
    subscribeToMobileHeaderExpanded,
    getMobileHeaderExpandedSnapshot,
    () => false,
  );

  const subscribeToCopyAlignedLeft = useCallback(
    (onStoreChange: () => void) => {
      if (pathname !== "/") {
        return () => {};
      }

      const copy = document.getElementById(LANDING_HERO_COPY_ID);
      const observer = copy ? new ResizeObserver(onStoreChange) : null;

      if (copy && observer) {
        observer.observe(copy);
      }

      window.addEventListener("resize", onStoreChange);

      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", onStoreChange);
      };
    },
    [pathname],
  );

  const getCopyAlignedLeftSnapshot = useCallback(() => {
    if (pathname !== "/") {
      return null;
    }

    return readCopyAlignedLeft();
  }, [pathname]);

  const copyAlignedLeft = useSyncExternalStore(
    subscribeToCopyAlignedLeft,
    getCopyAlignedLeftSnapshot,
    () => null,
  );

  const handleClick = () => {
    if (pathname === "/") {
      scrollLandingFullpageTo(0);
      return;
    }

    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="홈으로 이동"
      className={[
        "typo-logo-button desktop-header",
        isMobileHeaderExpanded ? "typo-logo-button--blurred" : "",
        isShowroomPage ? "typo-logo-button--showroom" : "",
        "flex items-center justify-start",
        "touch-manipulation focus-visible:outline focus-visible:outline-2",
        "focus-visible:outline-offset-4 focus-visible:outline-black",
      ].join(" ")}
      style={
        copyAlignedLeft === null
          ? undefined
          : { left: `${copyAlignedLeft}px` }
      }
    >
      <Image
        src={typoLogoPath}
        alt=""
        aria-hidden="true"
        width={1874}
        height={401}
        loading="eager"
        fetchPriority="high"
        unoptimized
        className="object-contain object-left transition-[filter] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={isShowroomPage ? { filter: "brightness(0) invert(1)" } : undefined}
      />
    </button>
  );
}
