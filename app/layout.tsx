import type { Metadata } from "next";
import localFont from "next/font/local";
import GlobalFooterReveal from "./components/GlobalFooterReveal";
import Header from "./components/Header";
import SitePageShell from "./components/SitePageShell";
import TypoLogoButton from "./components/TypoLogoButton";
import "./globals.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "sensibility",
  description: "TUK 21st graduation online exhibition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${pretendard.className} ${pretendard.variable} antialiased`}
      >
        <TypoLogoButton />
        <Header />
        <SitePageShell>{children}</SitePageShell>
        <GlobalFooterReveal />
      </body>
    </html>
  );
}
