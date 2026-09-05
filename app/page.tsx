import LandingScrollExperience from "./components/LandingScrollExperience";
import LandingHeroActionButton from "./components/LandingHeroActionButton";
import LandingFooter from "./components/LandingFooter";
import { LandingCarousel } from "./components/landing-carousel";

const HERO_BACKGROUND_SRC = "/images/bg.webm";
const CONCEPT_BACKGROUND_SRC = "/images/bg2.webm";
const MAIN_FILM_SRC = "/images/landing-main-player.webm";

export default function LandingPage() {
  return (
    <LandingScrollExperience
      hero={
        <div className="landing-hero relative flex h-full min-h-[100dvh] w-full flex-col justify-end overflow-hidden py-8 md:py-12">
          <video
            src={HERO_BACKGROUND_SRC}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            aria-hidden="true"
            className="landing-hero__background pointer-events-none absolute inset-0 z-0 block h-full w-full max-w-none object-cover object-center select-none"
          />
          <div className="landing-hero__gradient" aria-hidden="true" />
          <div className="landing-hero__copy relative z-[3] flex w-full flex-col items-start px-[var(--landing-copy-inset-x)]">
            <p
              id="landing-hero-copy"
              className="m-0 text-sm leading-snug tracking-tight text-systemNavy md:text-base"
            >
              26.09.18 FRI - 20 SUN
              <br />
              Hongik University Art Center B2
              <br />
              Department of Design Engineering
            </p>
            <p className="landing-hero-copy-secondary m-0 mt-2 text-[1.05rem] font-semibold leading-snug tracking-tight text-systemNavy md:mt-2.5 md:text-[1.2rem]">
              Tech University of Korea
              <br />
              21st Grad Exhibition
            </p>
          </div>
          <LandingHeroActionButton />
        </div>
      }
      concept={
        <div className="landing-concept relative flex h-full min-h-[100dvh] w-full items-center justify-center overflow-hidden">
          <video
            src={CONCEPT_BACKGROUND_SRC}
            autoPlay
            muted
            loop
            playsInline
            disablePictureInPicture
            aria-hidden="true"
            className="landing-hero__background pointer-events-none absolute inset-0 z-0 block h-full w-full max-w-none object-cover object-center select-none"
          />
          <div
            className="landing-concept__gradient landing-concept__gradient--top"
            aria-hidden="true"
          />
          <div
            className="landing-concept__gradient landing-concept__gradient--bottom"
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-[100dvh] w-full items-center justify-center pointer-events-auto">
            <LandingCarousel />
          </div>
        </div>
      }
      media={
        <div className="landing-media-showcase">
          <div className="landing-media-showcase__layout">
            <div className="landing-media-player landing-media-player--main">
              <video
                src={MAIN_FILM_SRC}
                controls
                playsInline
                preload="metadata"
                aria-label="21st graduation exhibition main film"
                className="landing-media-player__video"
              />
            </div>
            <div
              className="landing-media-showcase__side"
              aria-label="Additional film slots"
            >
              {["Film 02", "Film 03"].map((label) => (
                <div className="landing-media-slot" key={label}>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      footer={<LandingFooter />}
    />
  );
}
