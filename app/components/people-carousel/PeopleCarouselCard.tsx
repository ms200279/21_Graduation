"use client";

import Image from "next/image";
import Link from "next/link";
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
        {item.isGraduationCommittee ? (
          <span className="people-carousel-card__committee-label people-carousel-card__committee-label--compact">
            sensibility
          </span>
        ) : null}
      </div>

      <div className="people-carousel-card__profile">
        <div
          className="people-carousel-card__portrait"
          role={portraitSrc ? "img" : undefined}
          aria-label={portraitSrc ? `${item.name} portrait` : undefined}
        >
          {portraitSrc ? (
            <Image
              src={portraitSrc}
              alt=""
              width={675}
              height={900}
              sizes="(max-width: 767px) calc(100vw - 3.75rem), 25vw"
              className="people-carousel-card__portrait-image"
              priority
            />
          ) : null}
        </div>
        <div className="people-carousel-card__profile-copy">
          <div className="people-carousel-card__profile-heading">
            <h2 className="people-carousel-card__profile-name">{item.name}</h2>
            {item.isGraduationCommittee ? (
              <span className="people-carousel-card__committee-label people-carousel-card__committee-label--profile">
                sensibility
              </span>
            ) : null}
          </div>
          {item.role ? (
            <p className="people-carousel-card__profile-affiliation">
              {item.role}
            </p>
          ) : null}
          {item.phone ? (
            <p className="people-carousel-card__profile-phone">{item.phone}</p>
          ) : null}
          {showPortrait && item.projectHref ? (
            <Link
              href={item.projectHref}
              className="people-carousel-card__work"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="people-carousel-card__work-name">
                {item.projectTitle}
              </span>
              <span className="people-carousel-card__work-button">
                Project
              </span>
            </Link>
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
