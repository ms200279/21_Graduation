export const LANDING_MAIN_FILM_SRC = "/images/landing-main-player.webm";
export const LANDING_MAIN_FILM_POSTER = "/images/maintn.png";
export const LANDING_MEDIA_FILM_SRC = "/images/media-player.webm";
export const LANDING_MEDIA_FILM_POSTER = "/images/mediatn.png";
export const LANDING_INTERVIEW_FILM_SRC = "/images/interview-player.webm";
export const LANDING_INTERVIEW_FILM_POSTER = "/images/interviewtn.png";

export type LandingMediaFilmId = "main" | "media" | "interview";

export type LandingMediaFilm = {
  id: LandingMediaFilmId;
  src: string;
  label: string;
  poster?: string;
};

export const LANDING_MEDIA_FILMS: readonly LandingMediaFilm[] = [
  {
    id: "main",
    src: LANDING_MAIN_FILM_SRC,
    label: "main",
    poster: LANDING_MAIN_FILM_POSTER,
  },
  {
    id: "media",
    src: LANDING_MEDIA_FILM_SRC,
    label: "media",
    poster: LANDING_MEDIA_FILM_POSTER,
  },
  {
    id: "interview",
    src: LANDING_INTERVIEW_FILM_SRC,
    label: "interview",
    poster: LANDING_INTERVIEW_FILM_POSTER,
  },
];

export const LANDING_MEDIA_FILM_ORDER: LandingMediaFilmId[] = LANDING_MEDIA_FILMS.map(
  (film) => film.id,
);

export function getLandingMediaFilm(id: LandingMediaFilmId) {
  return LANDING_MEDIA_FILMS.find((film) => film.id === id) ?? LANDING_MEDIA_FILMS[0];
}

export function shouldLoadLandingMediaFilmSrc(
  featured: boolean,
  showcaseInView: boolean,
) {
  return featured && showcaseInView;
}

export function promoteLandingMediaFilm(
  order: readonly LandingMediaFilmId[],
  filmId: LandingMediaFilmId,
) {
  const currentIndex = order.indexOf(filmId);

  if (currentIndex <= 0) {
    return [...order];
  }

  const next = [...order];
  [next[0], next[currentIndex]] = [next[currentIndex], next[0]];
  return next;
}
