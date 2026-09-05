"use client";

import Image from "next/image";
import { memo, useEffect, useRef } from "react";
import SymbolCarouselIcons from "./SymbolCarouselIcons";
import type { LandingCarouselSlide } from "./slides";

const TYPO_HEADING_WIDTH = 290;
const TYPO_HEADING_HEIGHT = 62;

type ConceptCarouselSlideContentProps = {
  slide: LandingCarouselSlide;
  isActive: boolean;
};

function ConceptCarouselSlideContent({
  slide,
  isActive,
}: ConceptCarouselSlideContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isActive) {
      videoRef.current?.pause();
    }
  }, [isActive]);

  const isVideoSlide = Boolean(slide.videoSrc);

  return (
    <div
      className={[
        "landing-carousel__slide-card",
        isVideoSlide ? "landing-carousel__slide-card--video" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isVideoSlide ? null : (
        <p className="landing-carousel__slide-label">{slide.title}</p>
      )}
      <div
        className={[
          "landing-carousel__slide-copy",
          isVideoSlide ? "landing-carousel__slide-copy--video" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {slide.headingSymbols ? (
          <SymbolCarouselIcons variants={slide.headingSymbols} />
        ) : slide.headingImage ? (
          <Image
            src={slide.headingImage}
            alt=""
            aria-hidden="true"
            width={TYPO_HEADING_WIDTH}
            height={TYPO_HEADING_HEIGHT}
            loading={slide.id === "typography" ? "eager" : "lazy"}
            unoptimized
            className="landing-carousel__slide-heading-image"
          />
        ) : slide.heading ? (
          <h3 className="landing-carousel__slide-heading">{slide.heading}</h3>
        ) : null}
        {slide.paragraphs.length > 0 ? (
          <div className="landing-carousel__slide-paragraphs">
            {slide.paragraphs.map((paragraph, paragraphIndex) => (
              <p
                key={`${slide.id}-${paragraphIndex}`}
                className="landing-carousel__slide-paragraph"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
        {slide.videoSrc ? (
          <div
            className="landing-carousel__slide-video"
            onWheel={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={slide.videoSrc}
              controls
              playsInline
              preload={isActive ? "metadata" : "none"}
              aria-label={slide.videoLabel ?? slide.title}
              className="landing-carousel__slide-video-player"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default memo(ConceptCarouselSlideContent);
