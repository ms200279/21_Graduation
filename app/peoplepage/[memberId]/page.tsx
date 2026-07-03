import {
  PEOPLE_CAROUSEL_ITEMS,
  PeopleCategoryFilter,
  PeopleRotatingCarousel,
} from "@/app/components/people-carousel";

type PeopleMemberPageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function PeopleMemberPage({ params }: PeopleMemberPageProps) {
  const { memberId } = await params;

  return (
    <main className="people-page mx-auto max-w-6xl bg-white">
      <PeopleCategoryFilter />
      <PeopleRotatingCarousel
        items={PEOPLE_CAROUSEL_ITEMS}
        initialMemberSlug={memberId}
      />
    </main>
  );
}
