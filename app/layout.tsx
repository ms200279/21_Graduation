import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import GlobalFooterReveal from "./components/GlobalFooterReveal";
import Header from "./components/Header";
import MobileViewportShell from "./components/mobile-shell/MobileViewportShell";
import SitePageShell from "./components/SitePageShell";
import TypoLogoButton from "./components/TypoLogoButton";
import "./globals.css";
import "./styles/mobile-shell.css";
import "./styles/landing.css";
import "./styles/site-page-shell.css";
import "./styles/landing-footer.css";
import "./styles/site-header.css";
import "./styles/category-filter-buttons.css";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const GTM_ID = "GTM-W8TCNS9P";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>
      <body
        className={`${pretendard.className} ${pretendard.variable} antialiased`}
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <MobileViewportShell />
        <TypoLogoButton />
        <Header />
        <SitePageShell>{children}</SitePageShell>
        <GlobalFooterReveal />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
