"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Ganti isi daftar ini dengan skill final. Jumlah item menentukan panjang scroll
// (1 skill = 1 layar). Judul yang panjang otomatis turun ke baris berikutnya.
const SKILLS = [
  {
    title: "UI/UX DESIGN",
    description:
      "Merancang antarmuka aplikasi dan web dengan Figma, dari riset sampai prototipe.",
  },
  {
    title: "FULLSTACK DEVELOPMENT",
    description:
      "Membangun aplikasi web modern dengan React, Laravel, dan MySQL, dari tampilan sampai database.",
  },
  {
    title: "GRAPHIC DESIGN",
    description:
      "Mengolah visual dengan Photoshop, Illustrator, Affinity, dan Canva untuk berbagai kebutuhan.",
  },
  {
    title: "MOTION & INTERACTION",
    description:
      "Membuat animasi dan interaksi yang halus dengan After Effects, Blender, dan Framer.",
  },
];

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [layoutKey, setLayoutKey] = useState(0);

  // Baris deskripsi dihitung dari layout, jadi hitung ulang (lewat layoutKey)
  // setelah font siap dan saat lebar layar berubah.
  useEffect(() => {
    let timer: number | undefined;
    let lastWidth = window.innerWidth;
    const bump = () => setLayoutKey((key) => key + 1);
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(timer);
      timer = window.setTimeout(bump, 250);
    };

    document.fonts?.ready.then(bump);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ===== Teks & pergantian skill (bergantung pada layout, dihitung ulang
  // lewat layoutKey) =====
  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) return;

      const titles = gsap.utils.toArray<HTMLElement>(".skills-title", section);
      const descriptions = gsap.utils.toArray<HTMLElement>(
        ".skills-desc",
        section
      );
      const captions = [...titles, ...descriptions];
      const pegasus = section.querySelector<HTMLElement>(".skills-pegasus");
      const lastIndex = SKILLS.length - 1;

      const titleChars = titles.map((title) =>
        gsap.utils.toArray<HTMLElement>(".skills-char", title)
      );
      // Baris deskripsi dideteksi dari posisi vertikal kata (offsetTop)
      // karena pembungkusan teks dinamis.
      const descLines = descriptions.map((description) => {
        const lines: HTMLElement[][] = [];
        let lineTop = Number.NEGATIVE_INFINITY;

        gsap.utils
          .toArray<HTMLElement>(".skills-word", description)
          .forEach((word) => {
            if (Math.abs(word.offsetTop - lineTop) > 4) {
              lines.push([]);
              lineTop = word.offsetTop;
            }
            lines[lines.length - 1].push(word);
          });

        return lines;
      });
      const allChars = titleChars.flat();
      const allWords = descLines.flat(2);

      // ===== Efek glitch (sama dengan section Contact): berkedip + bergeser/
      // miring acak beberapa frame, lalu terkunci di posisi akhir. =====
      const rand = gsap.utils.random;
      const glitchTo = (
        tl: gsap.core.Timeline,
        target: gsap.TweenTarget,
        at: number,
        amp = 1
      ) => {
        tl.to(
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
              { autoAlpha: 1, x: rand(-5, 5) * amp, skewX: 0, duration: 0.04 },
              { autoAlpha: 0.4, x: rand(-3, 3) * amp, duration: 0.03 },
              { autoAlpha: 1, x: 0, skewX: 0, duration: 0.05 },
            ],
            ease: "none",
          },
          at
        );
      };
      const glitchOut = (
        tl: gsap.core.Timeline,
        target: gsap.TweenTarget,
        at: number
      ) => {
        tl.to(
          target,
          {
            keyframes: [
              { autoAlpha: 0.2, x: -8, duration: 0.04 },
              { autoAlpha: 1, x: 6, duration: 0.03 },
              { autoAlpha: 0, x: 0, duration: 0.05 },
            ],
            ease: "none",
          },
          at
        );
      };

      // Title: karakter muncul ACAK dengan glitch.
      const addTitleIn = (
        tl: gsap.core.Timeline,
        index: number,
        at: number,
        spread: number
      ) => {
        const chars = titleChars[index];

        if (!chars?.length) return;

        const order = gsap.utils.shuffle(chars.map((_, i) => i));

        chars.forEach((char, i) => {
          glitchTo(
            tl,
            char,
            at + (order[i] / Math.max(chars.length - 1, 1)) * spread
          );
        });
      };
      // Deskripsi: tiap baris muncul dari kanan bawah (sama dengan Works).
      const addDescIn = (
        tl: gsap.core.Timeline,
        index: number,
        at: number,
        duration: number,
        gap: number
      ) => {
        descLines[index]?.forEach((words, lineIndex) => {
          tl.fromTo(
            words,
            { autoAlpha: 0, x: 28, y: 22 },
            {
              autoAlpha: 1,
              x: 0,
              y: 0,
              duration,
              ease: "power2.out",
              immediateRender: false,
            },
            at + lineIndex * gap
          );
        });
      };

      const updateActive = (index: number) => {
        const next = Math.max(0, Math.min(lastIndex, index));

        if (activeIndexRef.current !== next) {
          activeIndexRef.current = next;
          setActiveIndex(next);
        }
      };

      // Keadaan awal: hanya skill pertama yang tampil.
      gsap.set(captions, { autoAlpha: 0 });
      gsap.set([titles[0], descriptions[0]], { autoAlpha: 1 });

      const showSkillImmediately = (index: number) => {
        updateActive(index);
        gsap.set(captions, { autoAlpha: 0, x: 0, y: 0 });
        gsap.set([titles[index], descriptions[index]], { autoAlpha: 1 });
      };

      // Intro skill pertama (diputar sekali saat section mulai masuk layar).
      // Mode reduced-motion: teks langsung tampil.
      const textMedia = gsap.matchMedia();

      textMedia.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(allChars, { autoAlpha: 0 });
        gsap.set(allWords, { autoAlpha: 0, x: 28, y: 22 });

        const intro = gsap.timeline({ paused: true });

        addTitleIn(intro, 0, 0, 0.3);
        addDescIn(intro, 0, 0.2, 0.7, 0.12);

        if (section.getBoundingClientRect().top < window.innerHeight * 0.4) {
          intro.play();
        } else {
          ScrollTrigger.create({
            trigger: section,
            start: "top 60%",
            once: true,
            onEnter: () => intro.play(),
          });
        }
      });

      // Pergantian skill mengikuti scroll: section di-pin (sticky) dan satu
      // layar scroll = satu skill.
      const projectMedia = gsap.matchMedia();

      if (lastIndex > 0) {
        const scrollTriggerOptions = {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
        };

        projectMedia.add("(prefers-reduced-motion: no-preference)", () => {
          const timeline = gsap.timeline({
            scrollTrigger: {
              ...scrollTriggerOptions,
              scrub: 0.8,
              onUpdate: (self) => {
                updateActive(Math.round(self.progress * lastIndex));
              },
            },
          });

          const HOLD = 0.25; // jeda diam sebelum & sesudah transisi
          const SPAN = 1 - HOLD * 2;

          for (let index = 1; index <= lastIndex; index += 1) {
            const start = index - 1 + HOLD;
            const enterAt = start + SPAN * 0.36;

            // Skill lama: glitch keluar.
            glitchOut(timeline, [titles[index - 1], descriptions[index - 1]], start);

            // Pegasus ikut berkedip tipis saat pergantian.
            if (pegasus) glitchTo(timeline, pegasus, start + SPAN * 0.3, 0.5);

            // Skill baru: wadah langsung tampil, lalu karakter title glitch
            // masuk dan baris deskripsi muncul dari kanan bawah.
            timeline.fromTo(
              [titles[index], descriptions[index]],
              { autoAlpha: 0 },
              {
                autoAlpha: 1,
                duration: SPAN * 0.02,
                ease: "none",
                immediateRender: false,
              },
              enterAt
            );
            addTitleIn(timeline, index, enterAt, SPAN * 0.24);
            addDescIn(timeline, index, enterAt + SPAN * 0.08, SPAN * 0.2, SPAN * 0.07);
          }
          // padding agar progres scroll 0..1 = seluruh rangkaian skill
          timeline.set({}, {}, lastIndex);
        });

        projectMedia.add("(prefers-reduced-motion: reduce)", () => {
          const trigger = ScrollTrigger.create({
            ...scrollTriggerOptions,
            onUpdate: (self) => {
              showSkillImmediately(Math.round(self.progress * lastIndex));
            },
          });

          showSkillImmediately(Math.round(trigger.progress * lastIndex));
        });
      }

      return () => {
        textMedia.revert();
        projectMedia.revert();
      };
    },
    {
      scope: sectionRef,
      dependencies: [layoutKey],
      revertOnUpdate: true,
    }
  );

  // ===== Line drawing (lining) =====
  // Terpisah dari effect di atas dan TANPA dependencies supaya animasi tidak
  // ter-revert saat layout dihitung ulang. Reveal dari tengah ke kiri & kanan.
  // Karena gambar lebih lebar dari layar, target reveal dihitung dari porsi
  // gambar yang benar-benar terlihat, jadi garis sampai ke tepi layar tepat di
  // akhir animasi (tidak ada waktu terbuang di area yang tak terlihat).
  useGSAP(
    () => {
      const section = sectionRef.current;
      const lining = section?.querySelector<HTMLImageElement>(".skills-lining");

      if (!section || !lining) return;

      const SHOWN = "inset(0% 0% 0% 0%)";
      const DRAW_DELAY = 0.3; // jeda sebelum mulai menggambar (detik)
      const DRAW_DURATION = 2.4;
      const HIDE_DURATION = 0.95;

      // Inset kiri/kanan (persen) saat garis tepat menyentuh tepi layar.
      const getEdgeInset = () => {
        const visible = Math.min(1, section.clientWidth / lining.offsetWidth);

        return Math.max(0, ((1 - visible) / 2) * 100 - 0.5);
      };

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        // Progres reveal 0..1 dianimasikan lewat objek proxy, lalu clip-path
        // dihitung simetris (kiri = kanan) di tiap frame. Dengan begitu tidak
        // ada interpolasi string clip-path yang bisa membuat satu sisi
        // langsung muncul.
        const state = { p: 0 };
        const applyClip = () => {
          const inset = 50 - state.p * (50 - getEdgeInset());

          lining.style.clipPath = `inset(0% ${inset}% 0% ${inset}%)`;
        };

        gsap.set(lining, { autoAlpha: 1 });
        applyClip();

        let shown = false;

        const toggleLining = (show: boolean) => {
          if (shown === show) return;

          shown = show;
          gsap.to(state, {
            p: show ? 1 : 0,
            duration: show ? DRAW_DURATION : HIDE_DURATION,
            delay: show ? DRAW_DELAY : 0,
            ease: show ? "power2.out" : "power2.in",
            overwrite: true,
            onUpdate: applyClip,
            onComplete: () => {
              // Setelah selesai, lepas clip sepenuhnya (aman saat resize).
              if (show) lining.style.clipPath = SHOWN;
              else applyClip();
            },
          });
        };

        // Zona tampil: dari section mulai masuk sampai stage selesai di-pin.
        ScrollTrigger.create({
          trigger: section,
          start: "top 80%",
          end: "bottom bottom",
          onEnter: () => toggleLining(true),
          onEnterBack: () => toggleLining(true),
          onLeave: () => toggleLining(false),
        });

        // Saat scroll ke ATAS, garis dihilangkan begitu stage mulai lepas dari
        // pin (section turun dari atas layar), tidak menunggu sampai section
        // keluar dari zona "top 80%" yang terlalu jauh. Saat scroll ke bawah,
        // garis dimunculkan lagi di titik yang sama jika sempat disembunyikan.
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          onEnter: () => toggleLining(true),
          onLeaveBack: () => toggleLining(false),
        });

        // Halaman dimuat saat section sudah berada di zona tampil.
        const rect = section.getBoundingClientRect();

        if (
          rect.top < window.innerHeight * 0.8 &&
          rect.bottom > window.innerHeight
        ) {
          toggleLining(true);
        }
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(lining, { autoAlpha: 1, clipPath: SHOWN });
      });

      return () => media.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="skills"
      aria-labelledby="skills-heading"
      style={{
        marginBottom:
          "calc(-1 * (clamp(120px,20vh,240px) + clamp(48px,8vh,96px)))",
        height: `${SKILLS.length * 100}svh`,
        minHeight: `${SKILLS.length * 600}px`,
      }}
      className="relative isolate bg-[#0a0303] text-white [&+*]:relative [&+*]:z-10"
    >
      <h2 id="skills-heading" className="sr-only">
        Skills
      </h2>

      {/* Stage menempel (sticky) setinggi layar selama skill berganti.
          overflow-hidden ada di sini, bukan di section, supaya sticky tetap jalan. */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* Lining latar (gambar webp di /public/lining-skill.webp). Wrapper
            dibuat lebih lebar dari stage (191%; 230vw di mobile) supaya kotak
            tengah ±50% lebar layar dan ujung diamond terpotong di tepi. Garis
            tengah (49,27% tinggi gambar) tetap disejajarkan dengan tengah stage
            lewat translate-y persentase, jadi tetap sejajar dengan title berapa
            pun lebarnya. Di-reveal lewat clip-path oleh GSAP (class skills-lining). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[191%] -translate-x-1/2 -translate-y-[49.27%] max-sm:w-[230vw]"
        >
          <Image
            src="/lining-skill.webp"
            alt=""
            width={2880}
            height={1104}
            unoptimized
            draggable={false}
            className="skills-lining invisible block h-auto w-full select-none"
          />
        </div>

        {/* Pegasus di tengah. Wrapper luar = posisi (CSS), div dalam = yang
            dianimasikan GSAP (glitch saat skill berganti). */}
        <div className="pointer-events-none absolute left-1/2 top-[48%] z-10 aspect-[753/975] h-[42svh] -translate-x-1/2 -translate-y-1/2">
          <div className="skills-pegasus relative h-full w-full will-change-transform">
            <div className="relative h-full w-full max-sm:opacity-75">
              <Image
                src="/pegasus-skill.webp"
                alt=""
                fill
                sizes="(max-width: 639px) 40vw, 30vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Title (kiri): semua skill menumpuk di sel grid yang sama, menempel
            dari ATAS supaya baris pertama selalu sejajar dengan deskripsi.
            Mobile: rata tengah. */}
        <div
          aria-live="polite"
          className="absolute left-[7%] top-[47%] z-20 grid w-[34%] max-sm:left-6 max-sm:top-[14%] max-sm:w-[calc(100%-3rem)] max-sm:text-center"
        >
          {SKILLS.map((skill, index) => (
            <h3
              key={skill.title}
              aria-hidden={index !== activeIndex}
              aria-label={skill.title}
              className="skills-title col-start-1 row-start-1 font-acerok text-[clamp(26px,3.7vw,72px)] font-normal uppercase leading-[1.05] tracking-[0.01em] text-flame max-sm:text-center max-sm:text-[clamp(28px,9vw,44px)]"
            >
              <span aria-hidden="true" className="block">
                {skill.title.split(" ").map((word, wordIndex, words) => (
                  <Fragment key={wordIndex}>
                    <span className="inline-block whitespace-nowrap">
                      {word.split("").map((char, charIndex) => (
                        <span
                          key={charIndex}
                          className="skills-char inline-block will-change-transform"
                        >
                          {char}
                        </span>
                      ))}
                    </span>
                    {wordIndex < words.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </span>
            </h3>
          ))}
        </div>

        {/* Deskripsi (kanan): rata kiri, kolom sempit sehingga terpecah jadi
            beberapa baris pendek. Mobile: rata tengah. */}
        <div
          aria-live="polite"
          className="absolute left-[66%] top-[47.5%] z-20 grid w-[27%] max-sm:bottom-[12%] max-sm:left-6 max-sm:top-auto max-sm:w-[calc(100%-3rem)] max-sm:text-center"
        >
          {SKILLS.map((skill, index) => (
            <p
              key={skill.title}
              aria-hidden={index !== activeIndex}
              className="skills-desc col-start-1 row-start-1 text-left font-switzer text-[clamp(12px,1.55vw,30px)] font-medium leading-[1.15] tracking-[-0.03em] text-flame max-sm:text-center max-sm:text-[14px]"
            >
              <span className="block">
                {skill.description.split(" ").map((word, wordIndex, words) => (
                  <Fragment key={wordIndex}>
                    <span className="skills-word inline-block will-change-transform">
                      {word}
                    </span>
                    {wordIndex < words.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}