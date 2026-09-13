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

const MOBILE_QUERY = "(max-width: 767px)";

function isKeyboardInput(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLTextAreaElement || element.isContentEditable) {
    return true;
  }

  if (!(element instanceof HTMLInputElement)) {
    return false;
  }

  return ![
    "button",
    "checkbox",
    "file",
    "hidden",
    "image",
    "radio",
    "range",
    "reset",
    "submit",
  ].includes(element.type);
}

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

  useEffect(() => {
    const dismissKeyboardOnEnter = (event: KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        event.isComposing ||
        event.keyCode === 229 ||
        !window.matchMedia(MOBILE_QUERY).matches
      ) {
        return;
      }

      const activeElement = document.activeElement;

      if (isKeyboardInput(activeElement)) {
        /*
         * Let the input's Enter/default submit handlers finish first.
         * Blurring synchronously can cancel form submission in iOS Safari.
         */
        window.setTimeout(() => {
          if (document.activeElement === activeElement) {
            activeElement.blur();
          }
        }, 0);
      }
    };

    document.addEventListener("keydown", dismissKeyboardOnEnter);

    return () => {
      document.removeEventListener("keydown", dismissKeyboardOnEnter);
    };
  }, []);

  return <div ref={probeRef} className="mobile-shell-safe-probe" aria-hidden="true" />;
}
