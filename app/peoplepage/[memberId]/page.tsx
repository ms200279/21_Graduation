import {
  PEOPLE_CAROUSEL_ITEMS,
  PeopleRotatingCarousel,
} from "@/app/components/people-carousel";

type PeopleMemberPageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function PeopleMemberPage({ params }: PeopleMemberPageProps) {
  const { memberId } = await params;

  return (
    <main className="mx-auto max-w-6xl bg-white">
      <PeopleRotatingCarousel
        items={PEOPLE_CAROUSEL_ITEMS}
        initialMemberSlug={memberId}
      />
    </main>
  );
}
