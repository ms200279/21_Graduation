"use client";

import { useRef } from "react";

import { getDeferredMediaSrc, useInView } from "@/app/utils/useInView";

type DeferredAutoplayVideoProps = {
  src: string;
  className?: string;
  rootMargin?: string;
};

export default function DeferredAutoplayVideo({
  src,
  className,
  rootMargin = "60% 0px",
}: DeferredAutoplayVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { rootMargin, once: true });
  const mediaSrc = getDeferredMediaSrc(src, inView);

  return (
    <video
      ref={ref}
      src={mediaSrc}
      autoPlay={inView}
      muted
      loop
      playsInline
      preload={inView ? "metadata" : "none"}
      disablePictureInPicture
      aria-hidden="true"
      className={className}
    />
  );
}
