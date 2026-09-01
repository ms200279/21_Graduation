import PeoplePageShell from "@/app/components/people-carousel/PeoplePageShell";

type PeopleMemberPageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function PeopleMemberPage({ params }: PeopleMemberPageProps) {
  const { memberId } = await params;

  return <PeoplePageShell initialMemberSlug={memberId} />;
}
