import type { Metadata } from "next";
import { Bebas_Neue, Azeret_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import FlameCursor from "@/components/FlameCursor";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const azeret = Azeret_Mono({
  subsets: ["latin"],
  variable: "--font-azeret",
  display: "swap",
});

const acerokMages = localFont({
  src: "../../public/fonts/AcerokMages.otf",
  variable: "--font-acerok-mages",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Afrian — Ideas into reality",
  description: "Portfolio Afrian, maker of things world wide.",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${bebas.variable} ${azeret.variable} ${acerokMages.variable}`}
    >
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700,800,900&display=swap"
        />
      </head>
      <body>
        <div className="noise-overlay" aria-hidden="true" />
        <SmoothScroll />
        {children}
        <FlameCursor />
      </body>
    </html>
  );
}