import PeoplePageContent from "./PeoplePageContent";

const PEOPLE_BACKGROUND_SRC = "/images/ppbg.webm";

export default function PeoplePageShell({
  initialMemberSlug,
}: {
  initialMemberSlug?: string;
}) {
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
      <PeoplePageContent initialMemberSlug={initialMemberSlug} />
    </main>
  );
}
