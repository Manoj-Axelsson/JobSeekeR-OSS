import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobseekeR™ — Open Source Job Market Scanner",
  description: "Automated daily Swedish job market scanner, CV competence matcher, and application tracking platform built for accessibility.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JobseekeR™",
  },
};

export const viewport = {
  themeColor: "#784e1d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-serif">
        <a href="#main-content" className="skip-link">
          Hoppa till huvudinnehåll (Skip to main content)
        </a>
        <div id="main-content" className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
