"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FIRST_LINE = "LET'S CREATE SOMETHING";
const SECOND_LINE = "TOGETHER.";

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          [
            "[data-contact-char]",
            "[data-contact-ornament]",
            "[data-contact-bg]",
            "[data-contact-piece]",
          ],
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
          }
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cleanups: Array<() => void> = [];

        // Cincin berputar terus; terpisah dari animasi muncul (beda elemen)
        // supaya rotation dan scale tidak saling timpa.
        const spin = gsap.to("[data-contact-spin]", {
          rotation: 360,
          duration: 18,
          ease: "none",
          repeat: -1,
        });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        });

        // Ornamen latar kiri/kanan: meluncur masuk dari sisi layar sambil fade in.
        timeline.fromTo(
          "[data-contact-bg='left']",
          { autoAlpha: 0, x: -80 },
          { autoAlpha: 1, x: 0, duration: 1.4, ease: "power3.out" },
          0
        );
        timeline.fromTo(
          "[data-contact-bg='right']",
          { autoAlpha: 0, x: 80 },
          { autoAlpha: 1, x: 0, duration: 1.4, ease: "power3.out" },
          0
        );

        // Heading baris 1: karakter muncul satu per satu.
        timeline.fromTo(
          "[data-contact-char='1']",
          { autoAlpha: 0, scale: 0.2, y: 20 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.035,
            ease: "back.out(1.8)",
          }
        );

        // Ornamen 3D muncul lebih dulu (membesar sambil opacity naik).
        timeline.fromTo(
          "[data-contact-ornament]",
          { autoAlpha: 0, scale: 0.2 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
            ease: "back.out(1.4)",
          },
          "-=0.15"
        );

        // Baru setelah itu teks "TOGETHER." muncul karakter per karakter.
        timeline.fromTo(
          "[data-contact-char='2']",
          { autoAlpha: 0, scale: 0.2, y: 20 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.035,
            ease: "back.out(1.8)",
          },
          "-=0.4"
        );

        // Cincin -> teks CONTACT ME: muncul satu per satu.
        timeline.fromTo(
          "[data-contact-piece]",
          { autoAlpha: 0, scale: 0.2 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
            stagger: 0.3,
            ease: "back.out(1.4)",
          },
          "-=0.15"
        );

        const section = root.current;
        const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

        // ===== Parallax ornamen (meniru OrnamentScene di Hero) =====
        // - rotasi: permukaan depan miring mengikuti kursor (0.55 rad ≈ 31.5°, sama dengan Hero)
        // - translasi: geser sedikit untuk kesan kedalaman
        // Diterapkan pada <img> di dalam pembungkus yang melakukan animasi muncul,
        // jadi tidak saling menimpa. Event hanya aktif saat mouse di atas Contact.
        const ornament = section?.querySelector<HTMLElement>(
          "[data-contact-parallax]"
        );
        if (section && ornament && hasFinePointer) {
          // FOV Hero sangat kecil (hampir ortografik), jadi perspektif dibuat jauh.
          gsap.set(ornament, {
            transformPerspective: 1600,
            transformOrigin: "50% 50%",
          });

          const ROT_MAX = 0.55 * (180 / Math.PI);

          const rotX = gsap.quickTo(ornament, "rotationX", {
            duration: 0.9,
            ease: "power3.out",
          });
          const rotY = gsap.quickTo(ornament, "rotationY", {
            duration: 0.9,
            ease: "power3.out",
          });
          const ox = gsap.quickTo(ornament, "x", {
            duration: 1.2,
            ease: "power3.out",
          });
          const oy = gsap.quickTo(ornament, "y", {
            duration: 1.2,
            ease: "power3.out",
          });

          const onMove = (e: PointerEvent) => {
            const rect = section.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
            const ny = (e.clientY - rect.top) / rect.height - 0.5;

            rotX(-ny * ROT_MAX);
            rotY(nx * ROT_MAX);
            ox(nx * 36);
            oy(ny * 22);
          };
          const onLeave = () => {
            rotX(0);
            rotY(0);
            ox(0);
            oy(0);
          };

          section.addEventListener("pointermove", onMove);
          section.addEventListener("pointerleave", onLeave);
          cleanups.push(() => {
            section.removeEventListener("pointermove", onMove);
            section.removeEventListener("pointerleave", onLeave);
          });
        }

        // ===== Parallax halus ornamen latar (bergerak berlawanan arah kursor) =====
        const bgImgs = section
          ? gsap.utils.toArray<HTMLElement>("[data-contact-bg-img]", section)
          : [];
        if (section && bgImgs.length && hasFinePointer) {
          const bgMoves = bgImgs.map((el) => ({
            x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3.out" }),
            y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3.out" }),
          }));
          const onBgMove = (e: PointerEvent) => {
            const rect = section.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const nx = (e.clientX - rect.left) / rect.width - 0.5;
            const ny = (e.clientY - rect.top) / rect.height - 0.5;
            bgMoves.forEach((m) => {
              m.x(nx * -28);
              m.y(ny * -18);
            });
          };
          const onBgLeave = () =>
            bgMoves.forEach((m) => {
              m.x(0);
              m.y(0);
            });
          section.addEventListener("pointermove", onBgMove);
          section.addEventListener("pointerleave", onBgLeave);
          cleanups.push(() => {
            section.removeEventListener("pointermove", onBgMove);
            section.removeEventListener("pointerleave", onBgLeave);
          });
        }

        // ===== Hover ornamen lingkaran (cincin + CONTACT ME) =====
        // - cincin: membesar & berputar lebih cepat
        // - label: sedikit membesar dan menjadi terang
        // - magnetik: seluruh lingkaran tertarik pelan ke arah kursor
        // Semua diterapkan pada elemen yang TIDAK dipakai animasi muncul
        // (wrapper magnet, <img> spin, span label), jadi tidak saling menimpa.
        const magnet = section?.querySelector<HTMLElement>(
          "[data-contact-magnet]"
        );
        const ringImg = section?.querySelector<HTMLElement>(
          "[data-contact-spin]"
        );
        const label = section?.querySelector<HTMLElement>(
          "[data-contact-label]"
        );
        if (magnet && ringImg && label && hasFinePointer) {
          const mx = gsap.quickTo(magnet, "x", {
            duration: 0.6,
            ease: "power3.out",
          });
          const my = gsap.quickTo(magnet, "y", {
            duration: 0.6,
            ease: "power3.out",
          });

          const MAGNET_STRENGTH = 0.18;

          const onEnter = () => {
            gsap.to(spin, {
              timeScale: 4,
              duration: 0.8,
              ease: "power2.out",
              overwrite: "auto",
            });
            gsap.to(ringImg, {
              scale: 1.1,
              duration: 0.6,
              ease: "back.out(1.6)",
              overwrite: "auto",
            });
            gsap.to(label, {
              scale: 1.1,
              opacity: 1,
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          const onMagnetMove = (e: PointerEvent) => {
            const rect = magnet.getBoundingClientRect();
            // rect ikut bergeser karena magnet sedang di-translate, jadi hitung
            // titik tengah dasar dengan mengurangi offset saat ini.
            const curX = Number(gsap.getProperty(magnet, "x")) || 0;
            const curY = Number(gsap.getProperty(magnet, "y")) || 0;
            const cx = rect.left - curX + rect.width / 2;
            const cy = rect.top - curY + rect.height / 2;
            mx((e.clientX - cx) * MAGNET_STRENGTH);
            my((e.clientY - cy) * MAGNET_STRENGTH);
          };

          const onExit = () => {
            mx(0);
            my(0);
            gsap.to(spin, {
              timeScale: 1,
              duration: 1,
              ease: "power2.out",
              overwrite: "auto",
            });
            gsap.to(ringImg, {
              scale: 1,
              duration: 0.6,
              ease: "power3.out",
              overwrite: "auto",
            });
            gsap.to(label, {
              scale: 1,
              opacity: 0.7,
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          gsap.set(label, { opacity: 0.7 });

          magnet.addEventListener("pointerenter", onEnter);
          magnet.addEventListener("pointermove", onMagnetMove);
          magnet.addEventListener("pointerleave", onExit);
          cleanups.push(() => {
            magnet.removeEventListener("pointerenter", onEnter);
            magnet.removeEventListener("pointermove", onMagnetMove);
            magnet.removeEventListener("pointerleave", onExit);
          });
        }

        return () => {
          cleanups.forEach((fn) => fn());
        };
      });
    },
    { scope: root }
  );

  const renderCharacters = (text: string, line: 1 | 2) =>
    Array.from(text).map((char, index) => (
      <span
        key={`${char}-${index}`}
        data-contact-char={line}
        aria-hidden="true"
        className="inline-block origin-center will-change-transform"
      >
        {char === " " ? "\u00a0" : char}
      </span>
    ));

  return (
    <section
      ref={root}
      id="contact"
      className="relative flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden bg-[#080000] px-[5vw] py-[clamp(80px,12vh,150px)] text-flame"
      aria-labelledby="contact-heading"
    >
      {/* Ornamen latar kiri & kanan (webp, merah gelap). Posisi vertikal sejajar area cincin. */}
      <div
        data-contact-bg="left"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[4vw] top-[63%] z-0 w-[36vw] max-w-[640px] -translate-y-1/2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-contact-bg-img
          src="/contact-ornament-left.webp"
          alt=""
          width={664}
          height={341}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block h-auto w-full select-none will-change-transform"
        />
      </div>
      <div
        data-contact-bg="right"
        aria-hidden="true"
        className="pointer-events-none absolute -right-[4vw] top-[63%] z-0 w-[36vw] max-w-[640px] -translate-y-1/2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-contact-bg-img
          src="/contact-ornament-right.webp"
          alt=""
          width={663}
          height={340}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block h-auto w-full select-none will-change-transform"
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1360px] flex-col items-center text-center">
        <h2
          id="contact-heading"
          className="font-switzer text-[clamp(27px,7.4vw,104px)] font-semibold italic leading-[0.88] tracking-[-0.075em]"
        >
          <span className="block whitespace-nowrap">
            <span className="sr-only">{FIRST_LINE}</span>
            {renderCharacters(FIRST_LINE, 1)}
          </span>

          {/* Baris 2: ornamen di kiri, "TOGETHER." di kanan, satu garis tengah */}
          <span className="mt-[0.12em] flex items-center justify-center gap-[0.4em] whitespace-nowrap font-acerok text-[1.04em] font-normal not-italic leading-[0.9] tracking-[-0.025em]">
            <span
              data-contact-ornament
              aria-hidden="true"
              className="relative top-[0.05em] block w-[2.5em] shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-contact-parallax
                src="/ornament.svg"
                alt=""
                width={1217}
                height={431}
                draggable={false}
                className="block h-auto w-full select-none will-change-transform"
              />
            </span>
            <span>
              <span className="sr-only">{SECOND_LINE}</span>
              {renderCharacters(SECOND_LINE, 2)}
            </span>
          </span>
        </h2>

        <div className="mt-[clamp(10px,2vw,32px)]">
          {/* data-contact-magnet: wrapper yang tertarik ke kursor saat hover */}
          <div
            data-contact-magnet
            className="relative flex aspect-square w-[clamp(150px,22vw,312px)] items-center justify-center will-change-transform"
          >
            {/* Pembungkus ini yang muncul (scale/opacity); gambar di dalamnya yang berputar */}
            <div
              data-contact-piece
              aria-hidden="true"
              className="absolute inset-0 will-change-transform"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-contact-spin
                src="/cursorFollowing.svg"
                alt=""
                draggable={false}
                className="h-full w-full select-none will-change-transform"
              />
            </div>

            <a
              data-contact-piece
              href="mailto:annosulistyanno@gmail.com"
              aria-label="Hubungi saya melalui email"
              className="relative z-10 flex aspect-square w-[58%] flex-col items-center justify-center rounded-full text-center font-acerok text-[clamp(11px,1.65vw,20px)] leading-[1.2] tracking-[0.04em] text-flame/70 transition-colors duration-300 hover:text-flame focus-visible:text-flame focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame"
            >
              <span data-contact-label className="block will-change-transform">
                <span className="block">CONTACT</span>
                <span className="block">ME</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}