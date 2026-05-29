"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const typoLogoPath = "/icons/typologo.svg";
const MOBILE_HEADER_EXPANDED_EVENT = "mobile-header-expanded-change";

function subscribeToMobileHeaderExpanded(onStoreChange: () => void) {
  window.addEventListener(MOBILE_HEADER_EXPANDED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(MOBILE_HEADER_EXPANDED_EVENT, onStoreChange);
  };
}

function getMobileHeaderExpandedSnapshot() {
  return document.body.classList.contains("mobile-header-expanded");
}

export default function TypoLogoButton() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobileHeaderExpanded = useSyncExternalStore(
    subscribeToMobileHeaderExpanded,
    getMobileHeaderExpandedSnapshot,
    () => false,
  );

  const handleClick = () => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        "flex h-[var(--typo-logo-height)] w-[var(--typo-logo-width)] items-center justify-center",
        "touch-manipulation focus-visible:outline focus-visible:outline-2",
        "focus-visible:outline-offset-4 focus-visible:outline-black",
      ].join(" ")}
    >
      <Image
        src={typoLogoPath}
        alt=""
        aria-hidden="true"
        width={538}
        height={105}
        unoptimized
        className="h-full w-full object-contain"
      />
    </button>
  );
}
