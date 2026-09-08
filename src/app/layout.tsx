import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import "../styles/game.css";
import { Toaster } from "@/components/ui/toaster";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Три цветка — садовая забава",
  description: "Четыре сезона гербария и живая погода по всей странице: летом бабочки, зимой снег, осенью листья, весной лепестки и светлячки.",
  keywords: ["match-3", "гербарий", "сад", "цветы", "казуальная игра"],
  authors: [{ name: "Садовая забава" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${jost.variable} antialiased`}
        data-time="day"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
