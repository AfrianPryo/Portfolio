"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import SeeMoreCard from "./SeeMoreCard";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ABOUT_CHARS = ["A", "B", "O", "U", "T"];
const ME_CHARS = ["M", "E"];

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            "[data-about-char]",
            "[data-me-char]",
            "[data-about-sparkle]",
            "[data-about-paragraph]",
            "[data-about-card]",
            "[data-about-tribal]",
          ],
          { autoAlpha: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: "none" }
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        });

        // 1. Tribal Background: animasi fade in atmosferik yang memudar halus dari transparan ke tajam
        tl.fromTo(
          "[data-about-tribal]",
          { autoAlpha: 0, scale: 0.92, filter: "blur(6px)" },
          {
            autoAlpha: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.4,
            ease: "power2.out",
          },
          0
        );

        // 2. Text "ABOUT": muncul per karakter membesar dari transparan (progresif)
        tl.fromTo(
          "[data-about-char]",
          { autoAlpha: 0, scale: 0.2, y: 20 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.08,
            ease: "back.out(1.8)",
          },
          0.05
        );

        // 3. Text "ME": menyusul tepat setelah "ABOUT", membesar per karakter dari transparan
        tl.fromTo(
          "[data-me-char]",
          { autoAlpha: 0, scale: 0.2, y: 20 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.09,
            ease: "back.out(1.8)",
          },
          0.42
        );

        // 4. 4 Bintang/Sparkle: muncul berurutan dari yang paling kiri ke kanan (scale & spin pop)
        tl.fromTo(
          "[data-about-sparkle]",
          { autoAlpha: 0, scale: 0, rotate: -75 },
          {
            autoAlpha: 1,
            scale: 1,
            rotate: 0,
            duration: 0.55,
            stagger: 0.1,
            ease: "back.out(2.2)",
          },
          0.52
        );

        // 5. Paragraf Teks: muncul dari bawah kanan (x & y positif meluncur ke 0)
        tl.fromTo(
          "[data-about-paragraph]",
          { autoAlpha: 0, x: 50, y: 45 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          0.62
        );

        // 6. Kartu See More: disesuaikan muncul selaras dari bawah kanan dengan scale masuk yang anggun
        tl.fromTo(
          "[data-about-card]",
          { autoAlpha: 0, x: 40, y: 45, scale: 0.92 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.95,
            ease: "power3.out",
          },
          0.7
        );
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      id="tentang"
      className="relative z-10 w-full h-screen min-h-[600px] bg-black overflow-hidden px-[4vw] py-[clamp(24px,4vw,60px)] flex flex-col justify-between"
    >
        {/* 
          Background Siluet Tribal Watermark (Sesuai Referensi Desain):
          Ujung kiri dan kanan difeather halus dengan mask linear gradient agar tidak tampak terpotong.
        */}
        <div
          data-about-tribal
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[min(96vw,1200px)] -translate-x-1/2 -translate-y-1/2 select-none will-change-transform"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/about-tribal-bg.png"
            alt=""
            width={1024}
            height={625}
            loading="lazy"
            decoding="async"
            className="h-auto w-full object-contain opacity-100 brightness-125 contrast-125 drop-shadow-[0_0_70px_rgba(255,34,0,0.25)]"
          />
        </div>

        {/* 
          Baris Atas: 
          Teks "ABOUT" di kiri atas dan "ME" di kanan atas dengan font Acerok Mages warna flame.
          Teks dipecah per karakter agar teranimasi membesar dan bertambah opacity secara progresif.
        */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1360px] items-start justify-between select-none">
          <h2
            aria-label="ABOUT"
            className="flex font-acerok text-[clamp(44px,7.5vw,115px)] font-normal leading-none uppercase tracking-normal text-flame"
          >
            {ABOUT_CHARS.map((char, i) => (
              <span
                key={i}
                data-about-char
                aria-hidden="true"
                className="inline-block origin-center will-change-transform"
              >
                {char}
              </span>
            ))}
          </h2>
          <h2
            aria-label="ME"
            className="flex font-acerok text-[clamp(44px,7.5vw,115px)] font-normal leading-none uppercase tracking-normal text-flame"
          >
            {ME_CHARS.map((char, i) => (
              <span
                key={i}
                data-me-char
                aria-hidden="true"
                className="inline-block origin-center will-change-transform"
              >
                {char}
              </span>
            ))}
          </h2>
        </div>

        {/* 
          Area Tengah: 
          Anchor tujuan ornamen 3D saat user scroll dari Hero ke About.
          Objek 3D Three.js meluncur turun dan melayang tepat di antara "ABOUT ME" dan konten bawah,
          di depan siluet tribal background.
        */}
        <div className="relative z-10 mx-auto my-auto flex w-full max-w-[1280px] items-center justify-center py-4">
          <div
            id="about-ornament-anchor"
            className="relative aspect-[1217/431] w-[min(68vw,740px)] min-w-[280px]"
          >
            {/* Spacer transparan: hanya untuk acuan posisi & ukuran ornamen 3D */}
            <div aria-hidden className="pointer-events-none block w-full aspect-[1217/431]" />
          </div>
        </div>

        {/* 
          Area Bawah: 
          Kolom Kiri (4 Sparkle + Manifesto Merah) & Kolom Kanan (Card See More)
          Sesuai persis dengan desain referensi
        */}
        <div className="relative z-20 mx-auto w-full max-w-[1360px] pt-4">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            {/* Kolom Kiri Bawah: 4 Sparkle Merah & Teks Paragraf */}
            <div className="max-w-[560px] select-none">
              {/* 4 Sparkle Merah (✦ ✦ ✦ ✦) berurutan dari kiri ke kanan */}
              <div className="mb-4 flex items-center gap-2.5 text-flame">
                {[...Array(4)].map((_, i) => (
                  <span
                    key={i}
                    data-about-sparkle
                    className="inline-flex origin-center will-change-transform"
                  >
                    <svg
                      viewBox="0 0 34 34"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    >
                      <path d="M17.0898 1.7002C17.2107 3.9668 17.3173 6.2334 17.4951 8.5C17.6134 10.0086 17.8886 11.5172 18.1203 13.0258C18.344 14.4832 19.5159 15.6549 20.9732 15.8789C22.4822 16.1108 23.9911 16.3865 25.5 16.5049C27.7666 16.6827 30.0333 16.7893 32.2998 16.9102C32.8664 16.9404 33.4334 16.9716 34 17.0049C33.4334 17.0382 32.8664 17.0694 32.2998 17.0996C30.0332 17.2205 27.7666 17.3271 25.5 17.5049C23.9901 17.6233 22.4802 17.8988 20.9702 18.1306C19.5137 18.3541 18.3421 19.5243 18.1175 20.9807C17.8862 22.48 17.6125 23.9793 17.4951 25.4785C17.3171 27.7523 17.2108 30.0261 17.0898 32.2998C17.0597 32.8665 17.0284 33.4333 16.9951 34C16.9619 33.4333 16.9305 32.8665 16.9004 32.2998C16.7795 30.0261 16.6731 27.7523 16.4951 25.4785C16.3777 23.9786 16.1034 22.4785 15.8718 20.9785C15.647 19.5227 14.4763 18.3526 13.0203 18.129C11.5135 17.8976 10.0067 17.6231 8.5 17.5049C6.23344 17.3271 3.96675 17.2205 1.7002 17.0996C1.13357 17.0694 0.566624 17.0382 0 17.0049C0.566628 16.9716 1.13357 16.9404 1.7002 16.9102C3.96676 16.7893 6.23344 16.6826 8.5 16.5049C10.0057 16.3868 11.5115 16.1121 13.0173 15.8805C14.4741 15.6564 15.6451 14.4848 15.869 13.0279C16.101 11.5186 16.3767 10.0093 16.4951 8.5C16.6729 6.2334 16.7795 3.9668 16.9004 1.7002C16.9306 1.13353 16.9618 0.566667 16.9951 0C17.0285 0.566667 17.0596 1.13353 17.0898 1.7002Z" />
                    </svg>
                  </span>
                ))}
              </div>

              {/* Paragraf Merah Flame (muncul dari bawah kanan) */}
              <p
                data-about-paragraph
                className="font-switzer text-[clamp(17px,1.65vw,25px)] font-medium leading-[1] tracking-[-0.015em] text-flame/60 will-change-transform"
              >
                Saya Afrian. Masih belajar, terus mencoba, dan perlahan membangun
                cara sendiri dalam desain dan pengembangan digital.
              </p>
            </div>

            {/* Kolom Kanan Bawah: Card See More (Frame 2) disesuaikan selaras */}
            <div
              data-about-card
              className="flex justify-start lg:justify-end will-change-transform"
            >
              <SeeMoreCard href="mailto:annosulistyanno@gmail.com" />
            </div>
          </div>
        </div>
      </section>
  );
}