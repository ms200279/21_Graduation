import {
  PEOPLE_CAROUSEL_ITEMS,
  PeopleCategoryFilter,
  PeopleRotatingCarousel,
} from "@/app/components/people-carousel";

const PEOPLE_BACKGROUND_SRC = "/images/ppbg.webm";

export default function PeoplePage() {
  return (
    <main className="people-page relative isolate mx-auto max-w-6xl">
      <div className="people-page__background-frame" aria-hidden="true">
        <video
          src={PEOPLE_BACKGROUND_SRC}
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          className="people-page__background"
        />
      </div>
      <PeopleCategoryFilter />
      <PeopleRotatingCarousel items={PEOPLE_CAROUSEL_ITEMS} />
    </main>
  );
}
