import LandingScrollExperience from "./components/LandingScrollExperience";

export default function LandingPage() {
  return (
    <LandingScrollExperience
      hero={
        <div className="flex h-full items-end p-8 md:p-12">
          <p className="text-sm text-[#999999] md:text-base">
            Graduation Online Exhibition
          </p>
        </div>
      }
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-8 md:px-12">
        <h1 className="text-2xl leading-tight md:text-4xl">Archive</h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#666666] md:text-base">
          스크롤로 올라온 두 번째 화면입니다. 이후 콘텐츠는 이 영역에
          채워집니다.
        </p>
      </div>
    </LandingScrollExperience>
  );
}
