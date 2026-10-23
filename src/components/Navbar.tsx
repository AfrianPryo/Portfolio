"use client";

import { useEffect, useState } from "react";
import ScrambleText from "./ScrambleText";

/**
 * Navbar terinspirasi dari productionportugal.com:
 * — link dibungkus bracket [ LABEL ]
 * — hover: bracket menyebar ke kiri/kanan + berubah warna accent (merah)
 * — animasi entrance: muncul dari atas satu-per-satu via GSAP (di-drive dari Hero.tsx)
 * — mobile: menu fullscreen (bg accent, teks besar bertumpuk) dengan bahasa
 *   visual yang sama dengan desktop: bracket, uppercase Switzer, ScrambleText
 */

const navLinks = [
  { label: "Beranda", href: "#" },
  { label: "Tentang", href: "#tentang" },
  { label: "Experience", href: "#experience" },
  { label: "Skill", href: "#skills" },
  { label: "Karya", href: "#works" },
];

export default function Navbar({ isResumePage = false }: { isResumePage?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = isResumePage
    ? navLinks.map((link) => ({
        ...link,
        href: link.href === "#" ? "/" : `/${link.href}`,
      }))
    : navLinks;

  // Daftar lengkap untuk menu mobile (urutan sama seperti desktop)
  const mobileLinks: { label: string; href: string }[] = [
    { label: "Resume", href: "/resume" },
    ...links,
    { label: "Kontak", href: isResumePage ? "/#contact" : "#contact" },
  ];

  // Escape menutup menu, kunci scroll body saat terbuka,
  // dan tutup otomatis saat layar melebar ke breakpoint md (desktop)
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-[1.8vw] pt-[0.1vw] font-switzer max-sm:px-3 max-sm:pt-2 pointer-events-none">
      {/*
        Overlay fullscreen (mobile). Sengaja berada langsung di bawah <header>
        (bukan di dalam elemen ber-data-reveal) supaya `fixed` tidak ikut
        terpengaruh transform animasi GSAP milik elemen induk.
      */}
      <nav
        id="mobile-nav"
        aria-label="Navigasi utama"
        aria-hidden={!menuOpen}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setMenuOpen(false);
        }}
        className={`pointer-events-auto fixed inset-0 z-0 flex flex-col justify-end bg-flame px-3 pb-[max(20px,env(safe-area-inset-bottom))] pt-24 transition-[clip-path,visibility] duration-[0.7s] ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          menuOpen
            ? "visible [clip-path:inset(0_0_0_0)]"
            : "invisible [clip-path:inset(0_0_100%_0)]"
        }`}
      >
        {/* Hover/sentuh satu link → link lain nge-blur */}
        <ul className="group/list flex flex-col items-start">
          {mobileLinks.map((link, i) => (
            <li
              key={link.label}
              className="overflow-hidden transition-[filter,opacity] duration-300 ease-out group-hover/list:not-hover:opacity-40 group-hover/list:not-hover:blur-[3px]"
            >
              <MobileLink
                href={link.href}
                label={link.label}
                open={menuOpen}
                delay={menuOpen ? 140 + i * 55 : 0}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Logo */}
      <a
        href={isResumePage ? "/" : "#"}
        aria-label="Beranda"
        data-nav
        data-reveal={isResumePage ? undefined : ""}
        className="pointer-events-auto relative z-10 block w-[9.65vw] min-w-[84px] shrink-0 pt-[clamp(10px,1.3vw,22px)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          width={1217}
          height={431}
          className={`block h-auto w-full transition-[filter] duration-500 ${
            menuOpen
              ? "brightness-0 md:invert md:drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              : "brightness-0 invert drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
          }`}
        />
      </a>

      {/* Semua link di kanan */}
      <nav
        aria-label="Navigasi utama"
        data-nav
        data-reveal={isResumePage ? undefined : ""}
        className="group/nav pointer-events-auto relative z-10 hidden items-center gap-[clamp(8px,1.6vw,28px)] md:flex"
      >
        <BracketLink
          href="/resume"
          label="Resume"
          className="mr-[clamp(44px,6.2vw,110px)]"
        />

        {links.map((link) => (
          <BracketLink key={link.label} href={link.href} label={link.label} />
        ))}
        <BracketLink
          href={isResumePage ? "/#contact" : "#contact"}
          label="Kontak"
        />
      </nav>

      {/* Tombol menu untuk layar kecil dan tablet (di bawah breakpoint md) */}
      <div
        data-nav
        data-reveal={isResumePage ? undefined : ""}
        className="pointer-events-auto relative z-10 md:hidden"
      >
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
          className={`font-switzer text-[12px] font-semibold uppercase leading-none tracking-tight transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 ${
            menuOpen
              ? "text-black focus-visible:outline-black"
              : "text-white focus-visible:outline-white"
          }`}
        >
          [ {menuOpen ? "Tutup" : "Menu"} ]
        </button>
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
  external,
  className = "",
}: {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group inline-flex items-center gap-[0.22em] whitespace-nowrap font-switzer text-[clamp(11px,0.95vw,16px)] font-semibold uppercase leading-none tracking-tight text-white opacity-80 transition-opacity duration-300 group-hover/nav:not-hover:opacity-40 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none ${className}`}
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

/**
 * Link besar untuk menu fullscreen mobile.
 * Bahasa visual sama dengan desktop: bracket [ ] yang menyebar + berubah warna
 * saat disentuh/hover/fokus. Di mobile tidak ada warna flame di atas bg flame,
 * jadi bracket berubah dari hitam samar → putih.
 * Teks muncul dengan efek "mask reveal" dari bawah (berurutan via `delay`).
 */
function MobileLink({
  href,
  label,
  open,
  delay,
}: {
  href: string;
  label: string;
  open: boolean;
  delay: number;
}) {
  return (
    <a
      href={href}
      tabIndex={open ? 0 : -1}
      style={{ transitionDelay: `${delay}ms` }}
      className={`group flex items-center gap-[0.08em] whitespace-nowrap font-switzer text-[min(14.5vw,9.6vh)] font-semibold uppercase leading-[0.95] tracking-[-0.04em] text-black transition-transform duration-[0.8s] ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Bracket buka */}
      <span
        className="inline-block font-semibold transition-all duration-[0.48s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-[0.06em] group-hover:text-white group-active:-translate-x-[0.06em] group-active:text-white group-focus-visible:-translate-x-[0.06em] group-focus-visible:text-white text-black/35"
      >
        [
      </span>

      <ScrambleText text={label} className="inline-block font-semibold" />

      {/* Bracket tutup */}
      <span
        className="inline-block font-semibold transition-all duration-[0.48s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[0.06em] group-hover:text-white group-active:translate-x-[0.06em] group-active:text-white group-focus-visible:translate-x-[0.06em] group-focus-visible:text-white text-black/35"
      >
        ]
      </span>
    </a>
  );
}