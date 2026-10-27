"use client";

import { useRef, type CSSProperties, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import RunningTextSection from "@/components/RunningTextSection";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MAIL_TO = "annosulistyanno@gmail.com";

// Aset background (grain merah + figur jatuh + bintang) dari desain.
// Simpan sebagai public/contact-bg.webp
const BG_SRC = "/contact-bg.webp";

// Satuan blur per karakter (dalam em), supaya blur ikut skala ukuran font.
const BLUR_STEP = 0.012;

// Tambahan blur (em) saat karakter masuk/keluar -> efek motion blur.
const MOTION_BLUR = 0.2;

type HeadingWord = {
  text: string;
  /** Tingkat blur tiap karakter (0 = tajam). Panjangnya = jumlah karakter. */
  blur: number[];
  /** Posisi di desktop (absolute di dalam heading). Di mobile mengalir biasa. */
  pos: string;
  /** Arah masuk kata: -1 dari kiri, 1 dari kanan, 0 hanya dari bawah. */
  dir: -1 | 0 | 1;
};

// Heading di desain: 2 baris, kata-kata tersebar, makin ke tengah/ujung makin blur.
const HEADING: HeadingWord[] = [
  {
    text: "WORK WITH",
    blur: [0, 0, 1, 3, 0, 5, 5, 5, 5],
    pos: "lg:absolute lg:left-0 lg:top-0",
    dir: -1,
  },
  {
    text: "AND",
    blur: [2, 4, 4],
    pos: "lg:absolute lg:left-[44.3%] lg:top-0",
    dir: 0,
  },
  {
    text: "MAKE",
    blur: [4, 2, 0, 0],
    pos: "lg:absolute lg:right-0 lg:top-0",
    dir: 1,
  },
  {
    text: "ME",
    blur: [0, 0],
    pos: "lg:absolute lg:left-0 lg:top-[0.95em]",
    dir: -1,
  },
  {
    text: "SOMETHING",
    blur: [0, 0, 0, 1, 2, 4, 6, 7, 9],
    pos: "lg:absolute lg:right-0 lg:top-[0.95em]",
    dir: 1,
  },
];

type InfoItem = {
  lines: [string, string];
  style: CSSProperties; // hanya berlaku di desktop (di mobile posisinya static)
  align?: "right";
};

// Teks kecil di tengah desain (placeholder dari desain, ganti dengan isi asli).
const INFO: InfoItem[] = [
  { lines: ["contact me", "lorem ipsum dolor"], style: { left: "2%", top: "47.8%" } },
  { lines: ["contact me", "lorem ipsum dolor"], style: { left: "2%", top: "51.8%" } },
  { lines: ["contact me", "for"], style: { left: "13.3%", top: "47.8%" } },
  { lines: ["contact me", "lorem ipsum dolor sit amet"], style: { left: "13.3%", top: "51.8%" } },
  { lines: ["contact me", "lorem"], style: { left: "31.7%", top: "47.8%" } },
  { lines: ["contact me", "lorem ipsum dolor"], style: { right: "17.5%", top: "48.4%" }, align: "right" },
  { lines: ["contact me", "lorem ipsum dolor"], style: { right: "17.5%", top: "52.4%" }, align: "right" },
  { lines: ["contact me", "for"], style: { right: "3%", top: "48.4%" }, align: "right" },
  { lines: ["contact me", "lorem ipsum dolor sit amet"], style: { right: "3%", top: "52.4%" }, align: "right" },
];

const charBlur = (el: Element) => Number((el as HTMLElement).dataset.blur ?? 0);

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Wrapper background diperbesar sedikit supaya parallax tidak membuka tepi.
        gsap.set("[data-bg-parallax]", { scale: 1.14, force3D: true });

        // ===== Parallax halus background mengikuti scroll (transform saja, ringan) =====
        gsap.fromTo(
          "[data-bg-parallax]",
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );

        // ===== ENTRANCE =====
        const inTl = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.out", force3D: true },
        });

        inTl
          // Bingkai: fade + scale lembut (tanpa clip-path/filter yang berat di repaint).
          .fromTo(
            "[data-frame]",
            { autoAlpha: 0, scale: 0.95, transformOrigin: "50% 50%" },
            { autoAlpha: 1, scale: 1, duration: 1.8, ease: "power3.out" },
            0
          )
          // Background: hanya opacity + scale pelan (murni GPU, tanpa blur) -> mulus.
          .fromTo(
            "[data-bg]",
            { autoAlpha: 0, scale: 1.12 },
            { autoAlpha: 1, scale: 1, duration: 3, ease: "power2.out" },
            0
          )
          // Kata heading menyapu masuk dari sisinya.
          .fromTo(
            "[data-word]",
            { xPercent: (_i, el) => Number((el as HTMLElement).dataset.dir) * -10 },
            { xPercent: 0, duration: 1.7, ease: "expo.out", stagger: 0.08 },
            0.4
          )
          // Karakter: motion blur mengendap ke blur desain.
          .fromTo(
            "[data-char]",
            {
              autoAlpha: 0,
              yPercent: 55,
              scaleY: 1.45,
              transformOrigin: "50% 100%",
              filter: (_i, el) => `blur(${charBlur(el) + MOTION_BLUR}em)`,
            },
            {
              autoAlpha: 1,
              yPercent: 0,
              scaleY: 1,
              filter: (_i, el) => `blur(${charBlur(el)}em)`,
              duration: 1.2,
              stagger: { each: 0.028, from: "start" },
            },
            0.45
          )
          // Teks kecil.
          .fromTo(
            "[data-info]",
            { autoAlpha: 0, y: 10, filter: "blur(5px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
              ease: "power2.out",
              stagger: 0.06,
              clearProps: "filter",
            },
            1.2
          )
          // Form & logo paling akhir.
          .fromTo(
            "[data-foot]",
            { autoAlpha: 0, y: 14, filter: "blur(6px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.9,
              ease: "power2.out",
              stagger: 0.12,
              clearProps: "filter",
            },
            1.5
          );

        // ===== EXIT =====
        const outTl = gsap.timeline({
          paused: true,
          defaults: { ease: "power2.in", force3D: true },
        });

        outTl
          // Form & teks kecil lebih dulu menghilang.
          .to(
            "[data-foot]",
            { autoAlpha: 0, y: -10, filter: "blur(6px)", duration: 0.5, stagger: 0.05 },
            0
          )
          .to(
            "[data-info]",
            { autoAlpha: 0, y: -8, filter: "blur(5px)", duration: 0.5, stagger: 0.02 },
            0
          )
          // Kata menyebar keluar ke sisinya.
          .to(
            "[data-word]",
            {
              xPercent: (_i, el) => Number((el as HTMLElement).dataset.dir) * 8,
              duration: 1.1,
              ease: "power2.inOut",
              stagger: 0.05,
            },
            0.05
          )
          // Karakter: motion blur ke atas lalu hilang.
          .to(
            "[data-char]",
            {
              autoAlpha: 0,
              yPercent: -50,
              scaleY: 1.4,
              transformOrigin: "50% 0%",
              filter: (_i, el) => `blur(${charBlur(el) + MOTION_BLUR}em)`,
              duration: 0.75,
              stagger: { each: 0.018, from: "start" },
            },
            0.05
          )
          // Background & bingkai memudar halus di akhir.
          .to(
            "[data-bg]",
            { autoAlpha: 0, scale: 1.06, duration: 1.3, ease: "power2.inOut" },
            0.2
          )
          .to(
            "[data-frame]",
            { autoAlpha: 0, scale: 0.97, duration: 1.1, ease: "power2.inOut" },
            0.35
          );

        const playIn = () => {
          outTl.pause();
          inTl.restart();
        };
        const playOut = () => {
          inTl.pause();
          outTl.invalidate().restart();
        };

        ScrollTrigger.create({
          trigger: root.current,
          start: "top 75%",
          end: "bottom 30%",
          onEnter: playIn,
          onEnterBack: playIn,
          onLeave: playOut,
          onLeaveBack: playOut,
        });
      });
    },
    { scope: root }
  );

  // Tanpa backend: buka aplikasi email user dengan isi yang sudah terisi.
  // Ganti dengan fetch("/api/contact", ...) kalau sudah punya endpoint.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    if (!email) return;

    const body = `Halo, saya ingin bekerja sama.\n\nHubungi saya di: ${email}`;
    window.location.href = `mailto:${MAIL_TO}?subject=${encodeURIComponent(
      "Ajakan kolaborasi dari website"
    )}&body=${encodeURIComponent(body)}`;

    e.currentTarget.reset();
  };

  return (
    <>
      <section
        ref={root}
        id="contact"
        aria-labelledby="contact-heading"
        className="w-full bg-[#080000] px-[2vw]"
      >
      <div
        data-frame
        className="relative isolate flex w-full flex-col justify-between gap-10 overflow-hidden bg-[#e00000] text-white will-change-transform max-lg:min-h-[680px] max-lg:px-[6vw] max-lg:py-[10vw] lg:block lg:aspect-[1366/803]"
      >
        {/* Background: grain merah + figur + bintang (sudah menyatu di aset).
            Wrapper = parallax scroll, img = animasi entrance/exit (dipisah agar transform tidak bentrok). */}
        <div
          data-bg-parallax
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-bg
            src={BG_SRC}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full select-none object-cover object-center"
          />
        </div>

        {/* Heading */}
        <h2
          id="contact-heading"
          className="relative z-10 font-acerok text-[10vw] font-normal uppercase leading-[0.92] tracking-[-0.07em] max-lg:flex max-lg:flex-wrap max-lg:gap-x-[0.28em] lg:absolute lg:inset-x-[2%] lg:top-[3%] lg:text-[6.8vw]"
        >
          <span className="sr-only">Work with me and make something</span>
          {HEADING.map((word) => (
            <span
              key={word.text}
              aria-hidden="true"
              data-word
              data-dir={word.dir}
              className={`block whitespace-nowrap ${word.pos}`}
            >
              {Array.from(word.text).map((char, i) => {
                const blur = (word.blur[i] ?? 0) * BLUR_STEP;
                return (
                  <span
                    key={`${char}-${i}`}
                    data-char
                    data-blur={blur}
                    className="inline-block"
                    style={blur ? { filter: `blur(${blur}em)` } : undefined}
                  >
                    {char === " " ? "\u00a0" : char}
                  </span>
                );
              })}
            </span>
          ))}
        </h2>

        {/* Teks kecil di tengah */}
        <div className="relative z-10 max-lg:grid max-lg:grid-cols-2 max-lg:gap-x-4 max-lg:gap-y-4 lg:contents">
          {INFO.map((item, i) => (
            <p
              key={i}
              data-info
              style={item.style}
              className={`font-switzer text-[10px] font-medium lowercase leading-[1.1] tracking-[-0.05em] lg:absolute lg:z-10 lg:whitespace-nowrap lg:text-[0.72vw] ${
                item.align === "right" ? "lg:text-right" : ""
              }`}
            >
              <span className="block">{item.lines[0]}</span>
              <span className="block">{item.lines[1]}</span>
            </p>
          ))}
        </div>

        {/* Form kiri bawah */}
        <form
          onSubmit={handleSubmit}
          data-foot
          className="relative z-10 flex flex-col gap-1 max-lg:w-full max-lg:max-w-[420px] lg:absolute lg:bottom-[3.6%] lg:left-[2%] lg:gap-[0.25vw]"
        >
          <label
            htmlFor="contact-email"
            className="font-switzer text-[11px] lowercase leading-none tracking-[-0.05em] lg:text-[0.65vw]"
          >
            your email
          </label>
          <div className="flex">
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              className="h-11 min-w-0 flex-1 border border-white/80 bg-transparent px-3 font-switzer text-base text-white outline-none focus:bg-white/10 lg:h-[1.82vw] lg:w-[14.6vw] lg:flex-none lg:px-[0.5vw] lg:text-[0.8vw]"
            />
            <button
              type="submit"
              className="group flex h-11 items-center bg-white px-4 font-switzer text-base lowercase tracking-[-0.05em] text-[#e00000] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:h-[1.82vw] lg:px-[0.6vw] lg:text-[0.8vw]"
            >
              submit
              {/* Icon plus: muncul di sisi kanan saat hover/focus */}
              <span
                aria-hidden="true"
                className="ml-0 block h-[10px] w-0 shrink-0 bg-current opacity-0 transition-all duration-300 group-hover:ml-1 group-hover:w-[10px] group-hover:opacity-100 group-focus-visible:ml-1 group-focus-visible:w-[10px] group-focus-visible:opacity-100 lg:h-[0.6vw] lg:group-hover:ml-[0.25vw] lg:group-hover:w-[0.6vw] lg:group-focus-visible:ml-[0.25vw] lg:group-focus-visible:w-[0.6vw]"
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
            </button>
          </div>
        </form>

        {/* Logo kanan bawah */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-foot
          src="/ornament.svg"
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="pointer-events-none relative z-10 select-none brightness-0 invert max-lg:w-[22vw] max-lg:self-end lg:absolute lg:bottom-[4.7%] lg:right-[2.3%] lg:w-[6.1%]"
        />
      </div>
      </section>
      <RunningTextSection />
    </>
  );
}