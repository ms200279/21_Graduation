import LandingScrollExperience from "./components/LandingScrollExperience";
import LandingHeroActionButton from "./components/LandingHeroActionButton";
import LandingFooter from "./components/LandingFooter";
import { LandingCarousel } from "./components/landing-carousel";
import LandingMediaShowcase from "./components/LandingMediaShowcase";
import LandingDeployClickBlock from "./components/LandingDeployClickBlock";
import LandingSplash from "./components/LandingSplash";
import DeferredAutoplayVideo from "./components/DeferredAutoplayVideo";
import { LANDING_HERO_VIDEO_SRC } from "./components/landingSplashModel";
import "./styles/landing.css";

const HERO_BACKGROUND_SRC = LANDING_HERO_VIDEO_SRC;
const CONCEPT_BACKGROUND_SRC = "/images/bg2.webm";

export default function LandingPage() {
  return (
    <>
      <LandingSplash />
      {/* TEMP: delete LandingDeployClickBlock.tsx, this line, and middleware.ts to restore the site. */}
      <LandingDeployClickBlock />
      <LandingScrollExperience
      hero={
        <div className="landing-hero snap-screen">
          <div className="snap-screen__backdrop">
            <video
              src={HERO_BACKGROUND_SRC}
              preload="auto"
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              aria-hidden="true"
              data-landing-first-screen-video
              className="landing-hero__background pointer-events-none block h-full w-full max-w-none object-cover object-center select-none"
            />
            <div className="landing-hero__gradient" aria-hidden="true" />
          </div>
          <div className="snap-screen__safe">
            <div className="snap-screen__content snap-screen__content--end py-8 md:py-12">
              <div className="landing-hero__copy relative z-[3] flex w-full flex-col items-start">
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
          </div>
        </div>
      }
      concept={
        <div className="landing-concept snap-screen">
          <div className="snap-screen__backdrop">
            <DeferredAutoplayVideo
              src={CONCEPT_BACKGROUND_SRC}
              className="landing-hero__background pointer-events-none block h-full w-full max-w-none object-cover object-center select-none"
            />
            <div
              className="landing-concept__gradient landing-concept__gradient--top"
              aria-hidden="true"
            />
            <div
              className="landing-concept__gradient landing-concept__gradient--bottom"
              aria-hidden="true"
            />
          </div>
          <div className="snap-screen__safe">
            <div className="snap-screen__content snap-screen__content--center pointer-events-auto">
              <LandingCarousel />
            </div>
          </div>
        </div>
      }
      media={
        <div className="snap-screen">
          <div className="snap-screen__backdrop landing-media-showcase-backdrop" />
          <div className="snap-screen__safe">
            <div className="snap-screen__content snap-screen__content--center">
              <LandingMediaShowcase />
            </div>
          </div>
        </div>
      }
      footer={<LandingFooter />}
    />
    </>
  );
}
