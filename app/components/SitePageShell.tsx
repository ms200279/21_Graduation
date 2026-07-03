"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SitePageShellProps = {
  children: ReactNode;
};

export default function SitePageShell({ children }: SitePageShellProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <div className={isLandingPage ? undefined : "site-page-shell"}>
      {children}
    </div>
  );
}
