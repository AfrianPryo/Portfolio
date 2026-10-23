"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import RunningTextSection from "@/components/RunningTextSection";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FIRST_LINE = "LET'S CREATE SOMETHING";
const SECOND_LINE = "TOGETHER.";
const MAIL_TO = "annosulistyanno@gmail.com";

const CARD_REST_ROTATION = -3;

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const cardMounted = useRef(false);
  const [open, setOpen] = useState(false);

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
            start: "top 85%", // mulai lebih cepat saat section baru masuk layar
            toggleActions: "play none none reverse",
          },
        });

        // Ornamen latar kiri/kanan: meluncur masuk dari sisi layar sambil fade in.
        // Posisi 0 = mulai bersamaan dengan heading.
        timeline.fromTo(
          "[data-contact-bg='left']",
          { autoAlpha: 0, x: -80 },
          { autoAlpha: 1, x: 0, duration: 1, ease: "power3.out" },
          0
        );
        timeline.fromTo(
          "[data-contact-bg='right']",
          { autoAlpha: 0, x: 80 },
          { autoAlpha: 1, x: 0, duration: 1, ease: "power3.out" },
          0
        );

        // ===== Kemunculan teks & ornamen: cepat dan glitchy (tanpa bounce) =====
        // Tiap elemen berkedip (opacity naik-turun) sambil bergeser/miring
        // acak beberapa frame, lalu "terkunci" di posisi akhirnya.
        const rand = gsap.utils.random;
        const glitchTo = (target: Element, at: number, amp = 1) => {
          timeline.to(
            target,
            {
              keyframes: [
                {
                  autoAlpha: 1,
                  x: rand(-12, 12) * amp,
                  skewX: rand(-30, 30) * amp,
                  duration: 0.04,
                },
                {
                  autoAlpha: 0.1,
                  x: rand(-8, 8) * amp,
                  skewX: rand(-20, 20) * amp,
                  duration: 0.04,
                },
                {
                  autoAlpha: 1,
                  x: rand(-5, 5) * amp,
                  skewX: 0,
                  duration: 0.04,
                },
                { autoAlpha: 0.4, x: rand(-3, 3) * amp, duration: 0.03 },
                { autoAlpha: 1, x: 0, skewX: 0, duration: 0.05 },
              ],
              ease: "none",
            },
            at
          );
        };
        const glitchChars = (line: 1 | 2, at: number, spread: number) => {
          const chars = gsap.utils.toArray<HTMLElement>(
            `[data-contact-char='${line}']`,
            root.current
          );
          const order = gsap.utils.shuffle(chars.map((_, i) => i));

          chars.forEach((el, i) => {
            glitchTo(
              el,
              at + (order[i] / Math.max(chars.length - 1, 1)) * spread
            );
          });
        };

        // Semua elemen disembunyikan dulu; kemunculannya diatur lewat glitchTo.
        gsap.set(
          [
            "[data-contact-char]",
            "[data-contact-ornament]",
            "[data-contact-piece]",
          ],
          { autoAlpha: 0 }
        );

        // Baris 1: karakter muncul ACAK dan cepat, langsung di detik 0.
        glitchChars(1, 0, 0.28);

        // Ornamen 3D: mulai saat baris 1 masih berjalan.
        glitchTo(
          gsap.utils.toArray<HTMLElement>(
            "[data-contact-ornament]",
            root.current
          )[0],
          0.22,
          1.4
        );

        // "TOGETHER." juga acak, tumpang tindih dengan ornamen.
        glitchChars(2, 0.3, 0.18);

        // Cincin -> teks CONTACT ME: muncul berurutan, cepat.
        gsap.utils
          .toArray<HTMLElement>("[data-contact-piece]", root.current)
          .forEach((piece, index) => {
            glitchTo(piece, 0.4 + index * 0.08, 1.2);
          });

        const section = root.current;
        const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

        // ===== Parallax ornamen (meniru OrnamentScene di Hero) =====
        const ornament = section?.querySelector<HTMLElement>(
          "[data-contact-parallax]"
        );
        if (section && ornament && hasFinePointer) {
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
            const nx = (e.clientX - rect.left) / rect.width - 0.5;
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
              filter: "brightness(1.4)",
              duration: 0.4,
              ease: "power2.out",
              overwrite: "auto",
            });
            gsap.to(label, {
              opacity: 1,
              filter: "brightness(1.3)",
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          const onMagnetMove = (e: PointerEvent) => {
            const rect = magnet.getBoundingClientRect();
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
              filter: "brightness(1)",
              duration: 0.5,
              ease: "power2.out",
              overwrite: "auto",
            });
            gsap.to(label, {
              opacity: 0.7,
              filter: "brightness(1)",
              duration: 0.4,
              ease: "power3.out",
              overwrite: "auto",
            });
          };

          gsap.set(label, { opacity: 0.7, filter: "brightness(1)" });
          gsap.set(ringImg, { filter: "brightness(1)" });

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

  // ===== Card mail: buka/tutup saat CONTACT ME diklik =====
  // Card meluncur dari kiri sambil sedikit berputar sampai miring -3° (seperti desain),
  // lalu field-nya muncul berurutan. Dipisah dari useGSAP di atas supaya
  // tidak ikut ter-revert saat state `open` berubah.
  useGSAP(
    () => {
      const card = root.current?.querySelector<HTMLElement>("[data-mail-card]");
      if (!card) return;
      const fields = gsap.utils.toArray<HTMLElement>("[data-mail-field]", card);
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Render pertama: sembunyikan card tanpa animasi.
      if (!cardMounted.current) {
        cardMounted.current = true;
        gsap.set(card, {
          autoAlpha: 0,
          x: -120,
          rotation: CARD_REST_ROTATION,
        });
        return;
      }

      gsap.killTweensOf([card, ...fields]);

      if (open) {
        if (reduce) {
          gsap.set(card, { autoAlpha: 1, x: 0, rotation: CARD_REST_ROTATION });
          gsap.set(fields, { autoAlpha: 1, y: 0 });
        } else {
          gsap.fromTo(
            card,
            { autoAlpha: 0, x: -140, rotation: CARD_REST_ROTATION - 8, scale: 0.94 },
            {
              autoAlpha: 1,
              x: 0,
              rotation: CARD_REST_ROTATION,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
            }
          );
          gsap.fromTo(
            fields,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.08,
              delay: 0.25,
              ease: "power3.out",
            }
          );
        }
        firstInput.current?.focus({ preventScroll: true });
      } else if (reduce) {
        gsap.set(card, { autoAlpha: 0 });
      } else {
        gsap.to(card, {
          autoAlpha: 0,
          x: -100,
          rotation: CARD_REST_ROTATION - 6,
          duration: 0.5,
          ease: "power3.in",
        });
      }
    },
    { scope: root, dependencies: [open] }
  );

  // Tekan Esc untuk menutup card.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    // Tanpa backend: buka aplikasi email user dengan isi yang sudah terisi.
    // Ganti bagian ini dengan fetch("/api/contact", ...) kalau sudah punya endpoint.
    const subject = `Pesan dari ${name || "website"}`;
    const body = `${message}\n\n— ${name}\n${email}`;
    window.location.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    e.currentTarget.reset();
    setOpen(false);
  };

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

  const fieldClass =
    "w-full border-0 border-b border-[#1a0000]/80 bg-transparent pb-[1.2cqw] pt-[3cqw] font-switzer text-[3.6cqw] max-lg:text-[max(16px,3.6cqw)] normal-case tracking-[0.02em] text-[#1a0000] outline-none placeholder:text-[3.2cqw] max-lg:placeholder:text-[max(13px,3.2cqw)] placeholder:uppercase placeholder:tracking-[0.06em] placeholder:text-[#1a0000]/75 focus:border-b-2 focus:border-[#1a0000]";

  return (
    <>
    <section
      ref={root}
      id="contact"
      className="relative flex min-h-[620px] max-lg:min-h-[720px] w-full flex-col items-center justify-center overflow-hidden bg-[#080000] px-[5vw] py-[clamp(80px,12vh,150px)] text-flame"
      aria-labelledby="contact-heading"
    >
      {/* Ornamen latar kiri & kanan (webp, merah gelap). Posisi vertikal sejajar area cincin. */}
      <div
        data-contact-bg="left"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[4vw] top-[63%] max-lg:top-[66%] z-0 w-[36vw] max-lg:w-[44vw] max-w-[640px] -translate-y-1/2"
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
        className="pointer-events-none absolute -right-[4vw] top-[63%] max-lg:top-[66%] z-0 w-[36vw] max-lg:w-[44vw] max-w-[640px] -translate-y-1/2"
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

            <button
              type="button"
              data-contact-piece
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="contact-mail-card"
              aria-label="Buka formulir kontak"
              className="relative z-10 flex aspect-square w-[58%] cursor-pointer flex-col items-center justify-center rounded-full text-center font-acerok text-[clamp(11px,1.65vw,20px)] leading-[1.2] tracking-[0.04em] text-flame/70 transition-colors duration-300 hover:text-flame focus-visible:text-flame focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-flame"
            >
              <span data-contact-label className="block will-change-transform">
                <span className="block">CONTACT</span>
                <span className="block">ME</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Card mail (muncul di kiri saat CONTACT ME diklik) =====
          Wrapper = posisi (CSS). Elemen [data-mail-card] = yang dianimasikan GSAP. */}
      <div className="pointer-events-none contents max-lg:absolute max-lg:inset-0 max-lg:z-30 max-lg:flex max-lg:items-center max-lg:justify-center">
      <div className="pointer-events-none absolute -left-[3vw] top-1/2 z-30 aspect-[0.72] h-[88%] max-h-[760px] max-w-[94vw] -translate-y-1/2 max-lg:static max-lg:h-auto max-lg:max-h-none max-lg:w-[min(88vw,420px)] max-lg:max-w-none max-lg:translate-y-0">
        <div
          id="contact-mail-card"
          data-mail-card
          role="dialog"
          aria-label="Kirim pesan"
          className="pointer-events-auto invisible relative h-full w-full will-change-transform [container-type:inline-size]"
        >
          {/* Background kertas merah (webp 800px ≈ 80KB) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mail-bg.webp"
            alt=""
            width={800}
            height={870}
            decoding="async"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[85%_top] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          />

          <form
            onSubmit={handleSubmit}
            className="relative flex h-full w-full flex-col pl-[15cqw] pr-[9cqw] pb-[8cqw] pt-[7cqw] text-[#1a0000] max-lg:overflow-y-auto"
          >
            <button
              type="button"
              data-mail-field
              onClick={() => setOpen(false)}
              className="self-start font-acerok text-[3.2cqw] max-lg:text-[max(12px,3.2cqw)] uppercase tracking-[0.12em] text-[#1a0000]/80 transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1a0000]"
            >
              Back
            </button>

            <div className="mt-[9cqw] flex flex-col gap-[4.5cqw]">
              <input
                ref={firstInput}
                data-mail-field
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your name"
                aria-label="Nama kamu"
                className={fieldClass}
              />
              <input
                data-mail-field
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Your email"
                aria-label="Email kamu"
                className={fieldClass}
              />
            </div>

            {/* Ruang kosong seperti di desain; kolom pesan menempel di bawahnya */}
            <textarea
              data-mail-field
              name="message"
              required
              rows={3}
              placeholder="Type concern here"
              aria-label="Pesan kamu"
              className={`${fieldClass} mt-auto resize-none max-lg:min-h-[28cqw] max-lg:shrink-0`}
            />

            <button
              type="submit"
              data-mail-field
              className="group mt-[7cqw] flex items-center gap-[2.5cqw] self-end font-acerok text-[13cqw] font-normal uppercase leading-none tracking-[-0.02em] text-[#1a0000]/85 transition-colors hover:text-black max-lg:shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1a0000]"
            >
              <span
                aria-hidden="true"
                className="block h-[6cqw] w-[6cqw] shrink-0 bg-current transition-transform duration-500 group-hover:rotate-90"
                style={{
                  WebkitMaskImage: "url(/icon-custom/Plus.svg)",
                  maskImage: "url(/icon-custom/Plus.svg)",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
              Submit
            </button>
          </form>
        </div>
      </div>
      </div>
    </section>
    <RunningTextSection />
    </>
  );
}