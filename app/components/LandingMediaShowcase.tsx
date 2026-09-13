"use client";

import { useState } from "react";

import {
  LANDING_MEDIA_FILM_ORDER,
  getLandingMediaFilm,
  promoteLandingMediaFilm,
  type LandingMediaFilmId,
} from "./landingMediaModel";

function LandingMediaItem({
  filmId,
  featured,
}: {
  filmId: LandingMediaFilmId;
  featured: boolean;
}) {
  const film = getLandingMediaFilm(filmId);

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
          src={film.src}
          poster={film.poster}
          controls={featured}
          playsInline
          preload="metadata"
          aria-label={`${film.label} film`}
          className="landing-media-player__video"
        />
      </div>
      <p className="landing-media-caption">{film.label}</p>
    </div>
  );
}

export default function LandingMediaShowcase() {
  const [order, setOrder] = useState(LANDING_MEDIA_FILM_ORDER);
  const [featuredId, ...sideIds] = order;

  return (
    <div className="landing-media-showcase">
      <div className="landing-media-showcase__layout">
        <LandingMediaItem filmId={featuredId} featured />
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
              <LandingMediaItem filmId={filmId} featured={false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
