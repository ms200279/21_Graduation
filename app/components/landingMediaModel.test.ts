import { describe, expect, it } from "vitest";

import {
  LANDING_MEDIA_FILM_ORDER,
  promoteLandingMediaFilm,
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
