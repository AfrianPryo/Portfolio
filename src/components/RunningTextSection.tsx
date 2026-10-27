"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ScrambleText from "./ScrambleText";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MARQUEE_TEXT = "CRAFTING BOLD IDEAS INTO UNFORGETTABLE DIGITAL EXPERIENCES";

const MAIL_TO = "annosulistyanno@gmail.com";

const MENU = [
  { label: "resume", href: "/resume" },
  { label: "beranda", href: "#" },
  { label: "tentang", href: "#tentang" },
  { label: "experience", href: "#experience" },
  { label: "skill", href: "#skills" },
  { label: "karya", href: "#works" },
  { label: "kontak", href: "#contact" },
];

// Durasi satu putaran penuh (detik) pada kecepatan normal — makin besar makin pelan.
const BASE_DURATION = 38;
// Dorongan kecepatan (px/detik) per px deltaY wheel. Makin besar makin terasa.
const WHEEL_GAIN = 5;
// Kontribusi kecepatan scrollY (touch/keyboard/Lenis), diredam supaya empuk.
const SCROLL_GAIN = 0.9;
// Batas tambahan kecepatan, kelipatan kecepatan dasar (total bisa sampai 1 + MAX_MULT, atau berbalik arah).
const MAX_MULT = 7;
// Seberapa cepat dorongan memudar (per detik) — makin kecil makin lama meluncur.
const DECAY = 2.2;
// Peredaman lerp untuk kecepatan dari scrollY, sama "empuk"-nya seperti RunningHeadline.
const DAMPING = 0.055;

// Gaya teks kecil yang sama dengan teks info di section Contact.
const SMALL =
  "font-switzer text-[12px] font-medium lowercase leading-[1.25] tracking-[-0.05em] lg:text-[max(11px,0.8vw)]";

export default function RunningTextSection() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pengguna yang mengurangi animasi: teks diam, tanpa marquee dan tanpa reveal.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Info footer masuk dengan blur tipis -> tajam, sama seperti teks kecil di Contact.
        gsap.from("[data-foot-item]", {
          autoAlpha: 0,
          y: 10,
          filter: "blur(5px)",
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.06,
          clearProps: "filter",
          scrollTrigger: {
            trigger: info.current,
            start: "top 92%",
            once: true,
          },
        });

        const el = track.current;
        if (!el) return;

        let x = 0;
        let impulse = 0; // dorongan dari wheel (px/detik, bertanda)
        let scrollBoost = 0; // dorongan dari scrollY (px/detik, bertanda)
        let lastY = window.scrollY;
        let half = el.scrollWidth / 2;
        let tickerActive = false;

        const resizeObserver = new ResizeObserver(() => {
          half = el.scrollWidth / 2;
        });
        resizeObserver.observe(el);

        // Seperti RunningHeadline: baca wheel langsung. Scroll ke bawah -> makin cepat ke kiri,
        // scroll ke atas -> melambat / berbalik sebentar. Dihitung sebagai impuls, bukan selisih per frame,
        // jadi tidak bergantung pada frame rate maupun smooth scroll (Lenis).
        const onWheel = (e: WheelEvent) => {
          impulse += e.deltaY * WHEEL_GAIN;
        };

        // Satu "grup" = setengah lebar track (ada 2 salinan identik → loop mulus).
        const tick = (_time: number, deltaMs: number) => {
          const dt = Math.min(Math.max(deltaMs, 1), 50) / 1000;

          if (!half) return;

          const base = half / BASE_DURATION;
          const limit = base * MAX_MULT;

          // Kecepatan scroll bertanda dari scrollY (mencakup touch & keyboard).
          const y = window.scrollY;
          const scrollVel = (y - lastY) / dt;
          lastY = y;
          scrollBoost +=
            (scrollVel * SCROLL_GAIN - scrollBoost) * (1 - Math.pow(1 - DAMPING, dt * 60));

          impulse *= Math.exp(-dt * DECAY);
          impulse = Math.max(-limit, Math.min(limit, impulse));

          const boost = Math.max(-limit, Math.min(limit, impulse + scrollBoost));

          x -= (base + boost) * dt;
          if (x <= -half) x += half;
          if (x > 0) x -= half;

          el.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
        };

        const visibilityObserver = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            lastY = window.scrollY;
            if (!tickerActive) {
              window.addEventListener("wheel", onWheel, { passive: true });
              gsap.ticker.add(tick);
              tickerActive = true;
            }
          } else if (tickerActive) {
            window.removeEventListener("wheel", onWheel);
            gsap.ticker.remove(tick);
            tickerActive = false;
            impulse = 0;
            scrollBoost = 0;
          }
        });
        if (root.current) visibilityObserver.observe(root.current);

        return () => {
          visibilityObserver.disconnect();
          resizeObserver.disconnect();
          window.removeEventListener("wheel", onWheel);
          gsap.ticker.remove(tick);
        };
      });
    },
    { scope: root }
  );

  return (
    <footer
      id="running-text"
      ref={root}
      aria-labelledby="running-text-heading"
      className="w-full bg-[#080000] px-[2vw] text-white"
    >
      <h2 id="running-text-heading" className="sr-only">
        Crafting bold ideas into unforgettable digital experiences
      </h2>

      {/* Marquee: full-bleed sampai tepi layar (menetralkan px-[2vw] footer) */}
      <div className="relative -mx-[2vw] flex min-h-[clamp(180px,25vw,320px)] items-center overflow-hidden py-12">
        {/* Anchor tujuan ornamen 3D: di tengah marquee, sedikit ke atas */}
        <div
          id="running-text-ornament-anchor"
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[58%] aspect-square w-[clamp(280px,40vw,640px)] -translate-x-1/2 -translate-y-1/2"
        />

        <div
          ref={track}
          className="relative flex w-max items-center font-acerok text-[clamp(34px,7vw,100px)] uppercase leading-[0.92] tracking-[-0.07em] text-flame will-change-transform"
        >
          <span aria-hidden="true" className="shrink-0 whitespace-nowrap pr-[1.5em]">
            {MARQUEE_TEXT}
          </span>
          <span aria-hidden="true" className="shrink-0 whitespace-nowrap pr-[1.5em]">
            {MARQUEE_TEXT}
          </span>
        </div>
      </div>

      {/* Info footer: kolom kirinya sejajar dengan teks kecil di Contact */}
      <div
        ref={info}
        className="grid grid-cols-2 gap-x-4 gap-y-10 px-[6vw] pb-[8vw] pt-6 lg:grid-cols-12 lg:gap-x-[1vw] lg:px-[2vw] lg:pb-[2.4vw] lg:pt-[2vw]"
      >
        <div data-foot-item className={`col-span-2 lg:col-span-3 ${SMALL}`}>
          <span className="block uppercase text-white/60">contact me</span>
          <a
            href={`mailto:${MAIL_TO}`}
            className="block break-all transition-colors duration-300 hover:text-flame focus-visible:text-flame focus-visible:underline focus-visible:outline-none"
          >
            {MAIL_TO}
          </a>
        </div>

        <div data-foot-item className={`col-span-2 lg:col-span-4 ${SMALL}`}>
          <span className="block uppercase text-white/60">menu</span>
          <ul className="group/nav mt-2 grid grid-flow-col grid-rows-4 justify-start gap-x-[clamp(24px,4vw,64px)] gap-y-[0.35em]">
            {MENU.map((link) => (
              <li key={link.label}>
                <FooterBracketLink href={link.href} label={link.label} />
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 flex flex-row-reverse items-end justify-between lg:col-span-5 lg:flex-col lg:items-end lg:justify-between">
          <div data-foot-item>
            <FooterBracketLink href="#" label="back to top" />
          </div>
          <p data-foot-item className={`${SMALL} uppercase text-white/60`}>
            portfolio of afrian
          </p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Link bracket [ LABEL ] yang sama dengan BracketLink di Navbar:
 * bracket menyebar + berubah warna flame saat hover/fokus, label pakai ScrambleText.
 */
function FooterBracketLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-[0.22em] whitespace-nowrap font-switzer text-[clamp(10px,0.8vw,13px)] font-semibold uppercase leading-none tracking-tight text-white opacity-80 transition-opacity duration-300 group-hover/nav:not-hover:opacity-40 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
    >
      <span className="inline-block font-semibold text-white/60 transition-all duration-[0.48s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-[0.34em] group-hover:text-flame group-focus-visible:-translate-x-[0.34em] group-focus-visible:text-flame">
        [
      </span>
      <ScrambleText text={label} className="inline-block font-semibold tracking-tight" />
      <span className="inline-block font-semibold text-white/60 transition-all duration-[0.48s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[0.34em] group-hover:text-flame group-focus-visible:translate-x-[0.34em] group-focus-visible:text-flame">
        ]
      </span>
    </a>
  );
}