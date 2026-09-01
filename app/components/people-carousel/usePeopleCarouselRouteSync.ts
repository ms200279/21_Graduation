"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

import { getMemberPathFromIndex, parseMemberSlugFromPath } from "./memberPaths";

type Options = {
  initialMemberSlug?: string;
  isHistorySyncRef: MutableRefObject<boolean>;
  closeExpandedCard: (options?: { syncHistory?: boolean }) => void;
  openExpandedCardFromSlug: (
    slug: string,
    options?: { syncHistory?: boolean },
  ) => void;
};

export function pushPeopleMemberUrl(
  itemIndex: number,
  isHistorySyncRef: MutableRefObject<boolean>,
) {
  const nextPath = getMemberPathFromIndex(itemIndex);

  if (window.location.pathname === nextPath) {
    return;
  }

  isHistorySyncRef.current = true;
  window.history.pushState({ peopleMember: nextPath }, "", nextPath);
}

export function usePeopleCarouselRouteSync({
  initialMemberSlug,
  isHistorySyncRef,
  closeExpandedCard,
  openExpandedCardFromSlug,
}: Options) {
  const pendingInitialSlugRef = useRef(initialMemberSlug ?? null);

  useEffect(() => {
    const onPopState = () => {
      if (isHistorySyncRef.current) {
        isHistorySyncRef.current = false;
        return;
      }

      const slug = parseMemberSlugFromPath(window.location.pathname);

      if (!slug) {
        closeExpandedCard({ syncHistory: false });
        return;
      }

      openExpandedCardFromSlug(slug, { syncHistory: false });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [closeExpandedCard, isHistorySyncRef, openExpandedCardFromSlug]);

  useEffect(() => {
    const slug = pendingInitialSlugRef.current;

    if (!slug) {
      return;
    }

    pendingInitialSlugRef.current = null;
    openExpandedCardFromSlug(slug, { syncHistory: false });
  }, [initialMemberSlug, openExpandedCardFromSlug]);
}
