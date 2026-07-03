import {
  PEOPLE_CAROUSEL_ITEMS,
  PeopleCategoryFilter,
  PeopleRotatingCarousel,
} from "@/app/components/people-carousel";

export default function PeoplePage() {
  return (
    <main className="people-page mx-auto max-w-6xl bg-white">
      <PeopleCategoryFilter />
      <PeopleRotatingCarousel items={PEOPLE_CAROUSEL_ITEMS} />
    </main>
  );
}
