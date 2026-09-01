"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isLandingPath, isShowroomPath } from "@/app/utils/routes";

type SitePageShellProps = {
  children: ReactNode;
};

export default function SitePageShell({ children }: SitePageShellProps) {
  const pathname = usePathname();
  const isLandingPage = isLandingPath(pathname);
  const isShowroomPage = isShowroomPath(pathname);

  return (
    <div
      className={[
        "site-page-shell-frame",
        isLandingPage ? "" : "site-page-shell",
        isShowroomPage ? "site-page-shell-frame--showroom" : "",
      ].join(" ")}
    >
      <div className="site-page-shell-backdrop" aria-hidden="true" />
      <div className="site-page-shell-content">{children}</div>
    </div>
  );
}
