import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Aether Roleplay", description: "Persistent cinematic AI roleplay platform", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#11132c", width: "device-width", initialScale: 1, maximumScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pl"><body>{children}</body></html>; }
