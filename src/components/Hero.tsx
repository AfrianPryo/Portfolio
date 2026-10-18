"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "./Navbar";
import CtaButton from "./CtaButton";
import RunningHeadline from "./RunningHeadline";
import SocialLinks from "./SocialLinks";
import ResumeButton from "./ResumeButton";
import BurnPreloader from "./BurnPreloader";
import OrnamentScene from "@/app/ornamentscene";

gsap.registerPlugin(useGSAP);

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const heroEntranceStarted = useRef(false);

  const [fallback, setFallback] = useState(false);
  const handleUnsupported = useCallback(() => setFallback(true), []);

  useEffect(() => {
    if (fallback) {
      gsap.to("[data-ornament]", {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        yPercent: 0,
        duration: 1.2,
        ease: "power3.out",
      });
    }
  }, [fallback]);

  // Callback saat api mulai merambat naik dari bawah membakar preloader
  const startHeroEntrance = useCallback(() => {
    if (heroEntranceStarted.current) return;
    heroEntranceStarted.current = true;

    if (typeof window !== "undefined") {
      (window as unknown as { __heroCurtainLifted?: boolean }).__heroCurtainLifted = true;
      window.dispatchEvent(new CustomEvent("hero:curtain-lift"));
    }

    const tl = gsap.timeline();

    // 1. Gambar siluet orang muncul perlahan dari bawah seiring kobaran api naik
    tl.to(
      "[data-person]",
      { autoAlpha: 1, y: 0, duration: 1.35, ease: "power3.out" },
      "+=0.05"
    );

    // 2. Heading text headline muncul menyusul
    tl.to(
      "[data-heading]",
      { autoAlpha: 1, y: 0, duration: 1.15, ease: "power4.out" },
      "-=0.7"
    );

    if (fallback) {
      tl.to(
        "[data-ornament]",
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          yPercent: 0,
          duration: 1.8,
          ease: "expo.out",
        },
        "-=0.7"
      );
    }

    // 3. Navbar, tombol resume ticket, dan tombol CTA masuk
    tl.to(
      "[data-nav]",
      { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.08 },
      "-=0.6"
    );
  }, [fallback]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pengguna yang mematikan animasi: langsung tampilkan semuanya tanpa preloader
      mm.add("(prefers-reduced-motion: reduce)", () => {
        if (typeof window !== "undefined") {
          (window as unknown as { __heroCurtainLifted?: boolean }).__heroCurtainLifted = true;
          window.dispatchEvent(new CustomEvent("hero:curtain-lift"));
        }
        gsap.set("[data-reveal]", { autoAlpha: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (typeof window !== "undefined") {
          (window as unknown as { __heroCurtainLifted?: boolean }).__heroCurtainLifted = false;
        }

        // Posisi awal elemen Hero sebelum terungkap oleh api
        gsap.set("[data-heading]", { autoAlpha: 0, y: 35 });
        gsap.set("[data-person]", { autoAlpha: 0, y: 70 });
        gsap.set("[data-nav]", { autoAlpha: 0, y: -15 });

        if (fallback) {
          gsap.set("[data-ornament]", {
            autoAlpha: 1,
            clipPath: "inset(0% 50% 0% 50%)",
            scale: 0.9,
            yPercent: 14,
            transformOrigin: "50% 50%",
          });
        }

        // Fallback ornamen melayang pelan setelah muncul
        if (fallback) {
          gsap.to("[data-float]", {
            y: -8,
            duration: 3.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: 2.2,
          });
        }
      });
    },
    { scope: root, dependencies: [fallback] }
  );

  return (
    <section
      ref={root}
      className="relative h-svh min-h-[500px] w-full overflow-hidden bg-black bg-[url('/hero-gradient.jpg')] bg-cover bg-center"
    >
      {/* ===== Transisi Terbakar dari Bawah ke Atas (Burn Reveal) ===== */}
      <BurnPreloader
        onBurnStart={startHeroEntrance}
      />

      <Navbar />

      {/* Layer 1: Running text headline satu baris di belakang foto PNG */}
      <RunningHeadline />

      {/* Layer 2: Foto PNG siluet di tengah hero section — ukuran diperbesar */}
      <div
        data-parallax-person
        className="pointer-events-none absolute bottom-0 left-1/2 z-[4] flex h-[min(94svh,1060px)] w-auto -translate-x-1/2 select-none items-end justify-center max-sm:h-[86svh]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-person.png"
          alt="Afrian"
          data-reveal
          data-person
          className="h-full w-auto max-w-[98vw] -scale-x-100 object-contain object-bottom drop-shadow-[0_28px_70px_rgba(0,0,0,0.9)]"
        />
      </div>

      {/* Layer 3: Anchor posisi ornamen 3D di depan dada foto siluet — naik sedikit */}
      <div
        data-parallax
        className="pointer-events-none absolute left-1/2 top-[51.5%] z-10 w-[min(68vw,760px)] min-w-[300px] -translate-x-1/2"
      >
        <div
          ref={anchorRef}
          data-ornament
          data-reveal={fallback ? true : undefined}
          className="relative w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-float={fallback ? true : undefined}
            src="/ornament.svg"
            alt=""
            width={1217}
            height={431}
            className={`block h-auto w-full ${fallback ? "" : "invisible"}`}
          />
        </div>
      </div>

      {/* Gradasi transisi bawah hero ke hitam pekat agar menyatu mulus dengan section About */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[35vh] max-h-[360px] bg-gradient-to-b from-transparent via-black/60 to-black"
      />

      {/* Tombol Unduh Resume (Look tiket bergaya terlipat) di kiri bawah */}
      <ResumeButton href="/resume.pdf" />

      {/* Tautan media sosial kanan bawah (di atas tombol CTA) */}
      <SocialLinks />

      {/* CTA kanan bawah */}
      <CtaButton />

      {/* Canvas Three.js — ornamen 3D di depan foto siluet */}
      {!fallback && (
        <OrnamentScene
          anchorRef={anchorRef}
          onUnsupported={handleUnsupported}
        />
      )}
    </section>
  );
}