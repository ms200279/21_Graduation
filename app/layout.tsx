import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "./components/Header";
import TypoLogoButton from "./components/TypoLogoButton";
import "./globals.css";

const pretendard = localFont({
  src: "../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Graduation Online Exhibition",
  description: "University graduation online exhibition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pretendard.variable} font-sans antialiased`}>
        <TypoLogoButton />
        <Header />
        {children}
      </body>
    </html>
  );
}
