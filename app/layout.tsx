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
import "./styles/landing-splash.css";
import "./styles/category-filter-buttons.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

const SITE_URL = "https://2026.tudesign.org";
const SITE_TITLE = "sensibility";
const SITE_DESCRIPTION =
  "2026 한국공학대학교 디자인공학부 온라인 졸업전시";
const OG_IMAGE_URL = `${SITE_URL}/images/ogimage.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if((location.pathname==="/"||location.pathname==="")&&!sessionStorage.getItem("landing-splash-shown-v2")){document.documentElement.classList.add("landing-splash-pending");window.__LANDING_SPLASH_PLAY=true;var s=document.createElement("style");s.id="landing-splash-boot";s.textContent=".desktop-header{visibility:hidden!important;pointer-events:none!important}";document.documentElement.appendChild(s);}}catch(e){}})();`,
          }}
        />
        {/* Keep GTM in the initial HTML head so Google's installation checker can detect it. */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
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
