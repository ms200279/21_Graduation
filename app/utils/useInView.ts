"use client";

import { useEffect, useState, type RefObject } from "react";

type UseInViewOptions = {
  rootMargin?: string;
  once?: boolean;
};

export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = "60% 0px", once = true }: UseInViewOptions = {},
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        setInView(true);

        if (once) {
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once, ref, rootMargin]);

  return inView;
}

export function getDeferredMediaSrc(src: string, shouldLoad: boolean) {
  return shouldLoad ? src : undefined;
}
