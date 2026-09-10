"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { detectWebGLSupport } from "./webglSupport";

type WebGLLayerProps = {
  children: ReactNode;
  fallback: ReactNode;
};

export default function WebGLLayer({ children, fallback }: WebGLLayerProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return null;
  }

  if (detectWebGLSupport() === "fallback") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
