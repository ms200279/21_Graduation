"use client";

import { useSyncExternalStore } from "react";
import { LANDING_SCROLL_PROGRESS_EVENT } from "../components/LandingScrollExperience";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(LANDING_SCROLL_PROGRESS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(LANDING_SCROLL_PROGRESS_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--landing-scroll-progress",
  );

  const progress = Number.parseFloat(raw);

  return Number.isFinite(progress) ? progress : 0;
}

function getServerSnapshot() {
  return 0;
}

export default function useLandingScrollProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
