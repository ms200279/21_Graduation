import LandingScrollExperience from "./components/LandingScrollExperience";
import LandingHeroActionButton from "./components/LandingHeroActionButton";
import { LandingCarousel } from "./components/landing-carousel";

const HERO_BACKGROUND_SRC = "/images/bg.webm";

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
      index={
        <div className="relative z-10 flex h-[100dvh] w-full items-center justify-center pointer-events-auto">
          <LandingCarousel />
        </div>
      }
      concept={
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-8 md:px-12">
          <h1 className="text-2xl leading-tight md:text-4xl">Concept</h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#666666] md:text-base">
            세 번째 스냅 화면입니다. Index ↔ Concept 구간에서는 헤더 전환 없이
            스크롤만 이동합니다.
          </p>
        </div>
      }
    />
  );
}
