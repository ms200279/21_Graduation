"use client";

import { useSyncExternalStore, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";

/**
 * TEMP production-only click/touch shield for the landing page.
 * Delete this file and its import in `app/page.tsx` to remove.
 */
export default function LandingDeployClickBlock() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (process.env.NODE_ENV !== "production" || !isMounted) {
    return null;
  }

  const block = (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return createPortal(
    <div
      className="landing-deploy-click-block"
      aria-hidden="true"
      onPointerDown={block}
      onClick={block}
      onContextMenu={block}
      onTouchStart={block}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        cursor: "default",
        touchAction: "none",
        userSelect: "none",
      }}
    />,
    document.body,
  );
}
