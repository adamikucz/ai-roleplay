import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Aether Roleplay",
  description: "Immersyjna platforma AI roleplay z pamięcią, relacjami i kinematograficzną narracją",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#0d0f21",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
