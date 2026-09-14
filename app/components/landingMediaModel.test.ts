import { describe, expect, it } from "vitest";

import {
  LANDING_MEDIA_FILM_ORDER,
  promoteLandingMediaFilm,
  shouldLoadLandingMediaFilmSrc,
} from "./landingMediaModel";

describe("promoteLandingMediaFilm", () => {
  it("moves the clicked film into the first slot", () => {
    expect(promoteLandingMediaFilm(LANDING_MEDIA_FILM_ORDER, "media")).toEqual([
      "media",
      "main",
      "interview",
    ]);
    expect(
      promoteLandingMediaFilm(["media", "main", "interview"], "interview"),
    ).toEqual(["interview", "main", "media"]);
  });

  it("keeps the first slot when that film is clicked again", () => {
    expect(promoteLandingMediaFilm(LANDING_MEDIA_FILM_ORDER, "main")).toEqual([
      "main",
      "media",
      "interview",
    ]);
  });
});

describe("shouldLoadLandingMediaFilmSrc", () => {
  it("loads only the featured film after the showcase is in view", () => {
    expect(shouldLoadLandingMediaFilmSrc(true, false)).toBe(false);
    expect(shouldLoadLandingMediaFilmSrc(false, true)).toBe(false);
    expect(shouldLoadLandingMediaFilmSrc(true, true)).toBe(true);
  });
});
