"use client";

import Image from "next/image";
import { memo } from "react";
import SymbolCarouselIcons from "./SymbolCarouselIcons";
import type { LandingCarouselSlide } from "./slides";

const TYPO_HEADING_WIDTH = 290;
const TYPO_HEADING_HEIGHT = 62;

type ConceptCarouselSlideContentProps = {
  slide: LandingCarouselSlide;
};

function ConceptCarouselSlideContent({
  slide,
}: ConceptCarouselSlideContentProps) {
  return (
    <div className="landing-carousel__slide-card">
      <p className="landing-carousel__slide-label">{slide.title}</p>
      <div className="landing-carousel__slide-copy">
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
      </div>
    </div>
  );
}

export default memo(ConceptCarouselSlideContent);
