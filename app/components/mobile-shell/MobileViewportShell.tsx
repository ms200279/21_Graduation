"use client";

import { useEffect, useRef } from "react";

import {
  applySafeAreaMetrics,
  applyViewportMetrics,
  dispatchMobileViewportChange,
  readSafeAreaFromProbe,
  readVisualViewportMetrics,
} from "./viewportMetrics";
import { detectWebGLSupport } from "./webglSupport";

export default function MobileViewportShell() {
  const probeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.webgl = detectWebGLSupport();

    const sync = () => {
      applyViewportMetrics(root, readVisualViewportMetrics(window));

      if (probeRef.current) {
        applySafeAreaMetrics(root, readSafeAreaFromProbe(probeRef.current));
      }

      dispatchMobileViewportChange();
    };

    sync();

    const visualViewport = window.visualViewport;
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    visualViewport?.addEventListener("resize", sync);
    visualViewport?.addEventListener("scroll", sync);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      visualViewport?.removeEventListener("resize", sync);
      visualViewport?.removeEventListener("scroll", sync);
    };
  }, []);

  return <div ref={probeRef} className="mobile-shell-safe-probe" aria-hidden="true" />;
}
