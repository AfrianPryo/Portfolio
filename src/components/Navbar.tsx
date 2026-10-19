"use client";

import ScrambleText from "./ScrambleText";

/**
 * Navbar terinspirasi dari productionportugal.com:
 * — link dibungkus bracket [ LABEL ]
 * — hover: bracket menyebar ke kiri/kanan + berubah warna accent (merah)
 * — animasi entrance: muncul dari atas satu-per-satu via GSAP (di-drive dari Hero.tsx)
 */

const navLinks = [
  { label: "Beranda", href: "#" },
  { label: "Tentang", href: "#tentang" },
  { label: "Karya", href: "#works" },
  { label: "Pengalaman", href: "#pengalaman" },
];

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-[1.8vw] pt-[0.1vw] font-switzer max-sm:px-3 max-sm:pt-2">
      {/* Logo */}
      <a
        href="#"
        aria-label="Beranda"
        data-nav
        data-reveal
        className="block w-[9.65vw] min-w-[84px] shrink-0 pt-[clamp(10px,1.3vw,22px)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          width={1217}
          height={431}
          className="block h-auto w-full brightness-0 invert"
        />
      </a>

      {/* Semua link di kanan */}
      <nav
        aria-label="Navigasi utama"
        data-nav
        data-reveal
        className="hidden items-center gap-[clamp(8px,1.6vw,28px)] sm:flex"
      >
        {/* Nav Resume di sebelah kiri Beranda langsung sebagai flex child dengan margin kanan lebih besar */}
        <BracketLink
          href="#resume"
          label="Resume"
          className="mr-[clamp(44px,6.2vw,110px)]"
        />

        {navLinks.map((link) => (
          <BracketLink key={link.label} href={link.href} label={link.label} />
        ))}
        <BracketLink href="#kontak" label="Kontak" accent />
      </nav>
    </header>
  );
}

/**
 * Satu link dengan bracket [ LABEL ] yang menyebar saat hover.
 * Bracket bergerak menjauhi label + berubah warna accent (merah).
 */
function BracketLink({
  href,
  label,
  accent,
  className = "",
}: {
  href: string;
  label: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-[0.22em] whitespace-nowrap font-switzer text-[clamp(11px,0.95vw,16px)] font-semibold uppercase leading-none tracking-tight text-white transition-opacity duration-300 ${
        accent ? "opacity-100" : "opacity-80 hover:opacity-100"
      } focus-visible:opacity-100 focus-visible:outline-none ${className}`}
    >
      {/* Bracket buka */}
      <span className="inline-block font-semibold text-white/60 transition-all duration-[0.48s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-[0.34em] group-hover:text-flame group-focus-visible:-translate-x-[0.34em] group-focus-visible:text-flame">
        [
      </span>

      {/* Label */}
      <ScrambleText text={label} className="inline-block font-semibold tracking-tight" />

      {/* Bracket tutup */}
      <span className="inline-block font-semibold text-white/60 transition-all duration-[0.48s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[0.34em] group-hover:text-flame group-focus-visible:translate-x-[0.34em] group-focus-visible:text-flame">
        ]
      </span>
    </a>
  );
}