import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import FlameCursor from "@/components/FlameCursor";

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
    <html lang="id">
      <head>
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700,800,900&display=swap"
        />
      </head>
      <body>
        <SmoothScroll />
        {children}
        <FlameCursor />
      </body>
    </html>
  );
}