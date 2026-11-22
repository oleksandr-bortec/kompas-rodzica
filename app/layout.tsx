import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { PersonaProvider } from "@/components/kr/persona-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Kompas Rodzica", template: "%s · Kompas Rodzica" },
  description:
    "Zasiłkowy Przewodnik Przyszłego Rodzica — sprawdź, co Ci przysługuje, w 3 minuty.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kompas Rodzica", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0E7C66",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <PersonaProvider>{children}</PersonaProvider>
      </body>
    </html>
  );
}
