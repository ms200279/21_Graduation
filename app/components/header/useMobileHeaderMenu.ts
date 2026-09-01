"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const MOBILE_HEADER_EXPANDED_EVENT = "mobile-header-expanded-change";

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

export function useMobileHeaderMenu({
  headerRef,
  pathname,
  isTransitionActive,
}: {
  headerRef: RefObject<HTMLElement | null>;
  pathname: string;
  isTransitionActive: boolean;
}) {
  const isMobile = useIsMobile();
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const mobileMenuPathRef = useRef<string | null>(null);
  const isOpen =
    isMobile && mobileMenuPath === pathname && !isTransitionActive;

  useEffect(() => {
    mobileMenuPathRef.current = mobileMenuPath;
  }, [mobileMenuPath]);

  useEffect(() => {
    if (!isMobile || !isOpen) {
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
  }, [headerRef, isMobile, isOpen]);

  useEffect(() => {
    const isExpanded = isMobile && isOpen;

    document.body.classList.toggle("mobile-header-expanded", isExpanded);

    window.dispatchEvent(
      new CustomEvent(MOBILE_HEADER_EXPANDED_EVENT, {
        detail: { expanded: isExpanded },
      }),
    );

    return () => {
      document.body.classList.remove("mobile-header-expanded");
      window.dispatchEvent(
        new CustomEvent(MOBILE_HEADER_EXPANDED_EVENT, {
          detail: { expanded: false },
        }),
      );
    };
  }, [isMobile, isOpen]);

  const open = useCallback(() => {
    setMobileMenuPath(pathname);
  }, [pathname]);

  const close = useCallback(() => {
    setMobileMenuPath(null);
  }, []);

  return {
    isMobile,
    isOpen,
    menuPathRef: mobileMenuPathRef,
    open,
    close,
  };
}
