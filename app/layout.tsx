import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
