"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { CreditScene } from "@/app/components/credits";
import { getCreditFragmentBySlug } from "@/app/components/credits/creditData";

type CreditsLayoutProps = {
  children: ReactNode;
};

export default function CreditsLayout({ children }: CreditsLayoutProps) {
  const pathname = usePathname();
  const fragmentSlug = pathname.match(/^\/creditspage\/([^/]+)\/?$/)?.[1];
  const fragment = fragmentSlug ? getCreditFragmentBySlug(fragmentSlug) : null;

  return (
    <main
      className={[
        "credits-page",
        fragment ? "credits-page--detail" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CreditScene initialFragmentId={fragment?.id ?? null} />
      {children}
    </main>
  );
}
