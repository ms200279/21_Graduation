import {
  PEOPLE_CAROUSEL_ITEMS,
  PeopleRotatingCarousel,
} from "@/app/components/people-carousel";

export default function PeoplePage() {
  return (
    <main className="mx-auto max-w-6xl bg-white">
      <PeopleRotatingCarousel items={PEOPLE_CAROUSEL_ITEMS} />
    </main>
  );
}
