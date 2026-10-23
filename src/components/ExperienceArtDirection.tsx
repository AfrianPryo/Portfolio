"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Satu blok = satu pengalaman dari resume (5 baris, maks. ±25 karakter per baris
// supaya tetap muat di samping pilar). Penomoran [1]–[5] dibuat otomatis.

// Posisi dalam persen terhadap frame desain (417 × 495).
// side "left"  : blok rata kanan, tepi kanannya berjarak `edge`% dari sisi kanan frame.
// side "right" : blok rata kiri,  tepi kirinya berjarak `edge`% dari sisi kiri frame.
// Di layar < 640px posisi ini diabaikan: blok disusun zig-zag (kiri/kanan bergantian)
// di atas pilar yang menjadi latar.
const highlights = [
  {
    side: "left",
    edge: 69.3,
    top: 18.8,
    lines: [
      "Aplikasi Edukasi. Mulai",
      "dari desain UI/UX web,",
      "lalu membangun sistem",
      "utuhnya sebagai fullstack",
      "developer di kelas X.",
    ],
  },
  {
    side: "right",
    edge: 62.8,
    top: 28.9,
    lines: [
      "Dashboard CRUD. Proyek",
      "individu di kelas XI PPLG",
      "membangun sistem utuh,",
      "dari tampilan sampai",
      "pengelolaan datanya.",
    ],
  },
  {
    side: "left",
    edge: 62.4,
    top: 43.2,
    lines: [
      "Game Development. Belajar",
      "membuat game sederhana",
      "sebagai proyek individu,",
      "sambil mengenal dunia",
      "game dari jurusan.",
    ],
  },
  {
    side: "right",
    edge: 70.7,
    top: 54.7,
    lines: [
      "Dicoding 2026. Mengikuti",
      "pembelajaran junior data",
      "scientist dan terus",
      "memperluas bidang yang",
      "saya pelajari.",
    ],
  },
  {
    side: "left",
    edge: 70.3,
    top: 70.5,
    lines: [
      "Kini: UI/UX E-Commerce",
      "Compify bersama tim, dan",
      "web portofolio pribadi",
      "sebagai proyek individu",
      "di tahun 2026.",
    ],
  },
] as const;

export default function ExperienceArtDirection() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pengguna yang mematikan animasi: semua elemen tetap tampil apa adanya.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Satu timeline yang mengikuti scroll (scrub) selama frame lewat di layar:
        // 1) pilar besar naik dari bawah viewport lalu mengecil ke ukuran aslinya,
        // 2) setelah itu ornamen dan paragraf muncul bergantian.
        const timeline = gsap.timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: {
            trigger: frame.current,
            start: "top 90%",
            end: "bottom 85%",
            scrub: 1.2, // angka lebih besar = lebih "licin" mengikuti scroll
          },
        });

        timeline.fromTo(
          "[data-exp-pillar]",
          { scale: 2.4, yPercent: 12, transformOrigin: "50% 0%" },
          {
            scale: 1,
            yPercent: 0,
            transformOrigin: "50% 0%",
            duration: 0.45,
            ease: "power2.inOut",
          },
          0
        );

        // Dua pilar di pinggir layar: meluncur masuk dari luar sambil fade in.
        timeline.fromTo(
          "[data-exp-side='left']",
          { autoAlpha: 0, x: -140 },
          { autoAlpha: 1, x: 0, duration: 0.4 },
          0.1
        );
        timeline.fromTo(
          "[data-exp-side='right']",
          { autoAlpha: 0, x: 140 },
          { autoAlpha: 1, x: 0, duration: 0.4 },
          0.1
        );


        // Teks mulai saat pilar baru ~70% mengecil, dan selesai sebelum scroll berakhir.
        timeline.fromTo(
          "[data-exp-text]",
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.05 },
          0.32
        );

        // Transisi keluar ke section Works: saat Works naik menimpa bagian bawah section ini,
        // isinya bergerak lebih lambat dari scroll (parallax) dan sedikit meredup
        // sehingga terasa tertimpa, bukan ikut terdorong.
        gsap.to(stage.current, {
          y: 72,
          opacity: 0.6,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "bottom bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      id="experience"
      aria-labelledby="experience-heading"
      style={{
        // = gap <main> + overlap tipis (8vh, maks 96px): Works menimpa sedikit
        marginBottom:
          "calc(-1 * (clamp(120px,20vh,240px) + clamp(48px,8vh,96px)))",
      }}
      className="relative isolate -mt-[clamp(120px,20vh,240px)] min-h-[760px] overflow-hidden [&+*]:relative [&+*]:z-10 bg-[#0a0303] px-[6vw] py-24 text-white max-sm:min-h-0 max-sm:px-5 max-sm:pb-28 max-sm:pt-20"
    >
      <h2 id="experience-heading" className="sr-only">
        Experience &amp; Art Direction
      </h2>

      {/* Wrapper setinggi frame: dipakai sebagai acuan posisi vertikal pilar pinggir. */}
      <div ref={stage} className="relative will-change-transform">
        {/* Pilar pinggir kiri & kanan: pusatnya tepat di tepi layar, jadi hanya setengah yang terlihat.
            -left/-right 6vw = padding section; disembunyikan di layar kecil supaya tidak menimpa teks. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[6vw] bottom-[6.9%] h-[66%] -translate-x-1/2 max-lg:hidden"
        >
          <div data-exp-side="left" className="h-full will-change-transform">
            <Image
              src="/pillar-art-direction.webp"
              alt=""
              width={843}
              height={2124}
              quality={85}
              sizes="400px"
              className="h-full w-auto max-w-none object-contain opacity-60"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[6vw] bottom-[6.9%] h-[66%] translate-x-1/2 max-lg:hidden"
        >
          <div data-exp-side="right" className="h-full will-change-transform">
            <Image
              src="/pillar-art-direction.webp"
              alt=""
              width={843}
              height={2124}
              quality={85}
              sizes="400px"
              className="h-full w-auto max-w-none object-contain opacity-60"
            />
          </div>
        </div>

        {/* Frame desain: semua posisi di dalamnya memakai persen dari frame 417 × 495.
            Mobile (< 640px): frame menjadi kolom setinggi isinya; pilar jadi latar. */}
        <div
          ref={frame}
          className="relative mx-auto flex w-full max-w-[1120px] flex-col [container-type:inline-size] aspect-[417/495] max-sm:aspect-auto max-sm:gap-12 max-sm:pb-6"
        >
          {/* Anchor tujuan ornamen 3D (dari OrnamentScene) di atas pilar.
              Hanya spacer transparan; ornamen 3D yang menempati posisinya. */}
          <div
            id="experience-ornament-anchor"
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[5.45%] w-[18.7%] -translate-x-1/2 max-sm:relative max-sm:left-auto max-sm:top-auto max-sm:w-[34%] max-sm:translate-x-0 max-sm:self-center"
          >
            <div aria-hidden className="block w-full aspect-[1217/431]" />
          </div>

          {/* Pilar utama: wrapper luar mengatur posisi (CSS), div dalam yang dianimasikan GSAP.
              Mobile: menempel di tengah frame, setinggi frame di bawah ornamen, jadi latar teks. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[11.7%] h-[81.4%] -translate-x-1/2 max-sm:top-14 max-sm:h-[calc(100%-3.5rem)]"
          >
            <div data-exp-pillar className="h-full will-change-transform">
              <Image
                src="/pillar-art-direction.webp"
                alt=""
                width={843}
                height={2124}
                quality={85}
                sizes="(max-width: 639px) 100vw, 860px"
                className="h-full w-auto max-w-none object-contain max-sm:opacity-40"
              />
            </div>
          </div>

          {highlights.map((highlight, index) => (
            <article
              key={index}
              data-exp-text
              style={{
                top: `${highlight.top}%`,
                ...(highlight.side === "left"
                  ? { right: `${highlight.edge}%` }
                  : { left: `${highlight.edge}%` }),
              }}
              className={`absolute z-10 font-switzer text-[length:max(10px,1.62cqw)] font-semibold leading-[1.2] tracking-[-0.04em] text-flame will-change-transform max-sm:static max-sm:text-[length:13px] ${
                highlight.side === "left"
                  ? "text-right max-sm:self-start max-sm:text-left"
                  : "text-left max-sm:self-end max-sm:text-right"
              }`}
            >
              <p>
                {highlight.lines.map((line, lineIndex) => (
                  <span
                    key={line}
                    className={`block whitespace-nowrap ${
                      lineIndex === 0 ? "relative" : ""
                    }`}
                  >
                    {/* Angka urutan menggantung di luar tepi paragraf (absolute),
                        jadi tidak ikut menggeser perataan baris pertama. Di layar
                        kecil kembali inline seperti semula. */}
                    {lineIndex === 0 && highlight.side === "right" && (
                      <span className="absolute right-full mr-[1em] max-sm:static">
                        {`[${index + 1}]`}
                      </span>
                    )}
                    {line}
                    {lineIndex === 0 && highlight.side === "left" && (
                      <span className="absolute left-full ml-[1em] max-sm:static">
                        {`[${index + 1}]`}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}