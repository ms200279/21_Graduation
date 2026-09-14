"use client";

import { useRef, useState } from "react";

import { getDeferredMediaSrc, useInView } from "@/app/utils/useInView";
import {
  LANDING_MEDIA_FILM_ORDER,
  getLandingMediaFilm,
  promoteLandingMediaFilm,
  shouldLoadLandingMediaFilmSrc,
  type LandingMediaFilmId,
} from "./landingMediaModel";

function LandingMediaItem({
  filmId,
  featured,
  showcaseInView,
}: {
  filmId: LandingMediaFilmId;
  featured: boolean;
  showcaseInView: boolean;
}) {
  const film = getLandingMediaFilm(filmId);
  const shouldLoad = shouldLoadLandingMediaFilmSrc(featured, showcaseInView);
  const mediaSrc = getDeferredMediaSrc(film.src, shouldLoad);

  return (
    <div
      className={[
        "landing-media-item",
        featured ? "landing-media-item--main" : "landing-media-item--side",
      ].join(" ")}
    >
      <div
        className={[
          "landing-media-player",
          featured ? "landing-media-player--main" : "landing-media-player--side",
        ].join(" ")}
      >
        <video
          src={mediaSrc}
          poster={film.poster}
          controls={featured}
          playsInline
          preload={shouldLoad ? "metadata" : "none"}
          aria-label={`${film.label} film`}
          className="landing-media-player__video"
        />
      </div>
      <p className="landing-media-caption">{film.label}</p>
    </div>
  );
}

export default function LandingMediaShowcase() {
  const showcaseRef = useRef<HTMLDivElement>(null);
  const showcaseInView = useInView(showcaseRef, {
    rootMargin: "60% 0px",
    once: true,
  });
  const [order, setOrder] = useState(LANDING_MEDIA_FILM_ORDER);
  const [featuredId, ...sideIds] = order;

  return (
    <div ref={showcaseRef} className="landing-media-showcase">
      <div className="landing-media-showcase__layout">
        <LandingMediaItem
          filmId={featuredId}
          featured
          showcaseInView={showcaseInView}
        />
        <div
          className="landing-media-showcase__side"
          aria-label="Additional films"
        >
          {sideIds.map((filmId) => (
            <button
              key={filmId}
              type="button"
              className="landing-media-slot"
              onClick={() => {
                setOrder((current) => promoteLandingMediaFilm(current, filmId));
              }}
              aria-label={`Move ${getLandingMediaFilm(filmId).label} to the main player`}
            >
              <LandingMediaItem
                filmId={filmId}
                featured={false}
                showcaseInView={showcaseInView}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
