"use client";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em]">Error</p>
      <h1 className="text-3xl font-semibold">페이지를 불러오지 못했습니다.</h1>
      <button
        type="button"
        onClick={reset}
        className="rounded-full border border-current px-5 py-2 text-sm"
      >
        다시 시도
      </button>
    </main>
  );
}
