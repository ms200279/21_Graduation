"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type CSSProperties,
} from "react";

import type { PeopleCarouselItem } from "./items";

function PeopleCarouselCardContent({
  item,
  showPortrait,
}: {
  item: PeopleCarouselItem;
  showPortrait: boolean;
}) {
  const portraitSrc = showPortrait ? item.photoSrc : undefined;

  return (
    <>
      <div className="people-carousel-card__compact-content">
        {item.role ? (
          <span className="people-carousel-card__role">{item.role}</span>
        ) : null}
        <span className="people-carousel-card__label">{item.name}</span>
      </div>

      <div className="people-carousel-card__profile">
        <div
          className="people-carousel-card__portrait"
          style={
            portraitSrc ? { backgroundImage: `url(${portraitSrc})` } : undefined
          }
          role={portraitSrc ? "img" : undefined}
          aria-label={portraitSrc ? `${item.name} portrait` : undefined}
        />
        <div className="people-carousel-card__profile-copy">
          <h2 className="people-carousel-card__profile-name">{item.name}</h2>
          {item.role ? (
            <p className="people-carousel-card__profile-affiliation">
              {item.role}
            </p>
          ) : null}
          {item.phone ? (
            <p className="people-carousel-card__profile-phone">{item.phone}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}

type Props = {
  item: PeopleCarouselItem;
  className: string;
  style?: CSSProperties;
};

export const PeopleCarouselCardSurface = forwardRef<HTMLDivElement, Props>(
  function PeopleCarouselCardSurface(
    { item, className, style },
    forwardedRef,
  ) {
    const surfaceRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(
      forwardedRef,
      () => surfaceRef.current as HTMLDivElement,
    );

    return (
      <div ref={surfaceRef} className={className} style={style}>
        <PeopleCarouselCardContent
          item={item}
          showPortrait={className.includes("people-carousel-expand__surface--open")}
        />
      </div>
    );
  },
);
