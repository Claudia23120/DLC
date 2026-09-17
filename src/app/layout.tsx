import type { Metadata, Viewport } from "next";
import { Anton, Figtree } from "next/font/google";
import { ca } from "@/i18n/ca";
import "./globals.css";

// Display heading font (uppercase, condensed) — matches the prototype's Anton.
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

// Body font.
const figtree = Figtree({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: ca.app.name,
  description: ca.app.tagline,
  appleWebApp: {
    capable: true,
    title: "Diables",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3a0b0a",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca" className={`${anton.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
