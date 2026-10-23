import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import FlameCursor from "@/components/FlameCursor";

export const metadata: Metadata = {
  metadataBase: new URL("https://afrianpryo.vercel.app"),
  title: {
    default: "Afrian Pryo Sulistyanno — UI/UX Designer & Web Developer",
    template: "%s | Afrian Pryo Sulistyanno",
  },
  description:
    "Portofolio Afrian Pryo Sulistyanno, UI/UX Designer dan Web Developer dari Jepara. Lihat karya desain, aplikasi web, pengalaman, dan resume.",
  applicationName: "Portofolio Afrian",
  authors: [{ name: "Afrian Pryo Sulistyanno" }],
  creator: "Afrian Pryo Sulistyanno",
  publisher: "Afrian Pryo Sulistyanno",
  keywords: [
    "Afrian Pryo Sulistyanno",
    "Afrian Pryo",
    "UI/UX Designer Jepara",
    "Web Developer Jepara",
    "Portofolio UI/UX",
    "Portofolio Web Developer",
    "Laravel Developer",
    "React Developer",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Portofolio Afrian",
    title: "Afrian Pryo Sulistyanno — UI/UX Designer & Web Developer",
    description:
      "Portofolio Afrian Pryo Sulistyanno. Jelajahi karya UI/UX, aplikasi web, pengalaman, dan resume.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Afrian Pryo Sulistyanno — UI/UX Designer & Web Developer",
    description:
      "Portofolio Afrian Pryo Sulistyanno. Jelajahi karya UI/UX, aplikasi web, pengalaman, dan resume.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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