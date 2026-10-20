"use client";

import { useEffect, useState } from "react";
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
  // "Pengalaman" dihapus: belum ada section dengan id #pengalaman di halaman.
  // Tambahkan kembali bersama section-nya jika sudah dibuat.
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup menu mobile dengan tombol Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-[1.8vw] pt-[0.1vw] font-switzer max-sm:px-3 max-sm:pt-2 pointer-events-none">
      {/* Logo */}
      <a
        href="#"
        aria-label="Beranda"
        data-nav
        data-reveal
        className="pointer-events-auto block w-[9.65vw] min-w-[84px] shrink-0 pt-[clamp(10px,1.3vw,22px)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          width={1217}
          height={431}
          className="block h-auto w-full brightness-0 invert drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
        />
      </a>

      {/* Semua link di kanan */}
      <nav
        aria-label="Navigasi utama"
        data-nav
        data-reveal
        className="pointer-events-auto hidden items-center gap-[clamp(8px,1.6vw,28px)] sm:flex"
      >
        {/* Nav Resume di sebelah kiri Beranda langsung sebagai flex child dengan margin kanan lebih besar */}
        <BracketLink
          href="/resume.pdf"
          label="Resume"
          external
          className="mr-[clamp(44px,6.2vw,110px)]"
        />

        {navLinks.map((link) => (
          <BracketLink key={link.label} href={link.href} label={link.label} />
        ))}
        <BracketLink href="#contact" label="Kontak" accent />
      </nav>

      {/* Menu untuk layar kecil (di bawah breakpoint sm) */}
      <div data-nav data-reveal className="pointer-events-auto sm:hidden">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
          className="font-switzer text-[12px] font-semibold uppercase leading-none tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          [ {menuOpen ? "Tutup" : "Menu"} ]
        </button>
        <nav
          id="mobile-nav"
          aria-label="Navigasi utama"
          hidden={!menuOpen}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setMenuOpen(false);
          }}
          className="absolute right-3 top-full mt-2 flex min-w-[170px] flex-col items-start gap-5 bg-black/90 px-5 py-5 backdrop-blur-sm"
        >
          <BracketLink
            href="/resume.pdf"
            label="Resume"
            external
            className="text-[15px]!"
          />
          {navLinks.map((link) => (
            <BracketLink
              key={link.label}
              href={link.href}
              label={link.label}
              className="text-[15px]!"
            />
          ))}
          <BracketLink
            href="#contact"
            label="Kontak"
            accent
            className="text-[15px]!"
          />
        </nav>
      </div>
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
  external,
  className = "",
}: {
  href: string;
  label: string;
  accent?: boolean;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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