import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/site-metadata";
import "./[locale]/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface antialiased text-text-primary">{children}</body>
    </html>
  );
}
