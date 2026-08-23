"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SitePageShellProps = {
  children: ReactNode;
};

export default function SitePageShell({ children }: SitePageShellProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isShowroomPage =
    pathname === "/showroompage" || pathname.startsWith("/showroompage/");

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
