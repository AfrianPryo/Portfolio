"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const MARQUEE_TEXT = "CRAFTING BOLD IDEAS INTO UNFORGETTABLE DIGITAL EXPERIENCES";

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

export default function RunningTextSection() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pengguna yang mengurangi animasi: teks diam, tanpa marquee.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
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
    <section
      id="running-text"
      ref={root}
      aria-labelledby="running-text-heading"
      className="relative flex min-h-[clamp(180px,25vw,320px)] w-full items-center overflow-hidden bg-[#080000] py-12"
    >
      {/* Gradient merah halus dari bawah */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-flame/25 via-flame/8 to-transparent"
      />

      <h2 id="running-text-heading" className="sr-only">
        Crafting bold ideas into unforgettable digital experiences
      </h2>

      {/* Anchor tujuan ornamen 3D: di tengah section, sedikit ke atas (sebelumnya top-[72%]) */}
      <div
        id="running-text-ornament-anchor"
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[58%] aspect-square w-[clamp(280px,40vw,640px)] -translate-x-1/2 -translate-y-1/2"
      />

      <div
        ref={track}
        className="relative flex w-max items-center font-acerok text-[clamp(34px,7vw,100px)] leading-none tracking-[0.04em] text-flame will-change-transform"
      >
        <span aria-hidden="true" className="shrink-0 whitespace-nowrap pr-[1.5em]">
          {MARQUEE_TEXT}
        </span>
        <span aria-hidden="true" className="shrink-0 whitespace-nowrap pr-[1.5em]">
          {MARQUEE_TEXT}
        </span>
      </div>
    </section>
  );
}