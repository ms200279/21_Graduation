import Link from "next/link";

import { SITE_PATHS } from "@/app/utils/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em]">404</p>
      <h1 className="text-3xl font-semibold">페이지를 찾을 수 없습니다.</h1>
      <Link
        href={SITE_PATHS.landing}
        className="rounded-full border border-current px-5 py-2 text-sm"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
