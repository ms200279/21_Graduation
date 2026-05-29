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
      index={
        <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-8 md:px-12">
          <h1 className="text-2xl leading-tight md:text-4xl">Index</h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#666666] md:text-base">
            랜딩에서 첫 스크롤로 도달하는 두 번째 화면입니다. 이후 콘텐츠는
            이 영역에 채워집니다.
          </p>
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
