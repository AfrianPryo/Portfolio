"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ProjectCategory = "website" | "design" | "art";

const CATEGORIES: { id: ProjectCategory; label: string }[] = [
  { id: "website", label: "WEBSITE" },
  { id: "design", label: "DESIGN" },
  { id: "art", label: "ART" },
];

// Wall (greek-wall.webp) sudah dipotong rapat: 2735x1346, pilar menyentuh tepi
// atas & bawah. Stage selalu setinggi viewport (atas/bawah tidak pernah
// terpotong); bagian samping boleh terpotong di layar sempit. Semua elemen
// dekor (frame, kartu, menu) diposisikan dalam persen dari stage ini.
const WALL_RATIO = 2735 / 1046;
// Stretch horizontal: lebar wall = tinggi layar x WALL_RATIO x WALL_STRETCH_X.
// 1 = proporsi asli, >1 = pilar lebih lebar (sisi kiri-kanan makin terpotong).
const WALL_STRETCH_X = 1.25;
// Stretch vertikal: tinggi wall (dan stage sticky) = tinggi layar x
// WALL_STRETCH_Y. 1 = pas setinggi layar, >1 = wall lebih tinggi dan TIDAK
// dipotong; section ditambah panjang yang sama supaya durasi pin/scroll
// proyek tetap sama, dan sisa wall terlihat saat section di-scroll masuk/keluar.
const WALL_STRETCH_Y = 1.35;
const WALL_EXTRA_Y = Math.max(WALL_STRETCH_Y, 1) - 1;
// Pin scroll (pergantian preview proyek) tidak mulai saat atas section
// menyentuh atas layar, tapi setelah section di-scroll biasa sebesar
// PIN_OFFSET_Y x tinggi layar (stage menempel dengan atasnya di
// -PIN_OFFSET_Y x tinggi layar). Dibatasi WALL_EXTRA_Y supaya bawah stage
// tidak pernah terlihat kosong saat pin aktif.
const PIN_OFFSET_Y = Math.min(0.21, WALL_EXTRA_Y);
// Posisi vertikal dari desain (persen tinggi layar saat pin aktif) diubah ke
// persen layer stage, yang sudah naik sebesar PIN_OFFSET_Y.
const pinTop = (viewportPercent: number) =>
  `${viewportPercent + PIN_OFFSET_Y * 100}%`;
// Lingkaran progres (viewBox 100): keliling dipakai untuk stroke-dashoffset.
const RING_R = 48;
const RING_C = 2 * Math.PI * RING_R;
// Skala awal lingkaran kursor (lebih kecil); membesar ke 1 saat hover preview.
const CURSOR_BASE_SCALE = 0.55;
// Garis atas title & deskripsi (persen tinggi layar saat pin aktif). Keduanya
// memakai nilai yang sama dan menempel dari ATAS (tidak di-center), jadi baris
// pertama selalu sejajar di sumbu x berapa pun jumlah barisnya.
const TEXT_TOP = 46.7;
// Warna teks title/deskripsi + bintang (merah marun gelap sesuai desain).
const INK = "#3b0c10";

// Bintang 4 sudut dari /icon-custom/Plus.svg. SVG-nya berwarna putih, jadi
// dipakai sebagai mask supaya warnanya mengikuti INK. Posisinya (left/top
// dalam px, titik tengah bintang) diisi lewat pengukuran di useGSAP supaya
// selalu menempel di awal baris pertama / akhir baris terakhir teks, berapa
// pun jumlah baris dan panjang katanya.
const STAR_MASK = "url(/icon-custom/Plus.svg)";

function Star() {
  return (
    <span
      aria-hidden="true"
      className={`works-star pointer-events-none absolute left-0 top-0 block aspect-square w-[clamp(7px,0.95vw,17px)] -translate-x-1/2 -translate-y-1/2`}
      style={{
        backgroundColor: INK,
        WebkitMaskImage: STAR_MASK,
        maskImage: STAR_MASK,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

const PROJECTS: {
  title: string;
  description: string;
  category: ProjectCategory;
  image: string;
}[] = [
  {
    title: "AGILISM ABCDE",
    description: "Proyek website pilihan.",
    category: "website",
    image: "/projects/project-1.svg",
  },
  {
    title: "SOLARIS",
    description: "Neo-brutalist commerce.",
    category: "website",
    image: "/projects/project-5.svg",
  },
  {
    title: "CHRONO ARCHIVE",
    description: "Kinetic typography experiment.",
    category: "design",
    image: "/projects/project-2.svg",
  },
  {
    title: "LUMEN ANALYTICS",
    description: "Real-time GPU trading visualizer.",
    category: "design",
    image: "/projects/project-3.svg",
  },
  {
    title: "AURA SOUND LAB",
    description: "Generative frequency synthesis.",
    category: "art",
    image: "/projects/project-4.svg",
  },
];

export default function Works() {
  const sectionRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorIconRef = useRef<HTMLImageElement>(null);
  const viewTextRef = useRef<HTMLImageElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const activeProjectIndexRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, inside: false });
  const [activeCategory, setActiveCategory] =
    useState<ProjectCategory>("website");
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [layoutKey, setLayoutKey] = useState(0);
  const filteredProjects = PROJECTS.filter(
    (project) => project.category === activeCategory
  );

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

  useGSAP(
    () => {
      const section = sectionRef.current;
      const preview = previewRef.current;
      const cursor = cursorRef.current;
      const cursorIcon = cursorIconRef.current;
      const viewText = viewTextRef.current;

      if (!section || !preview || !cursor || !cursorIcon || !viewText) return;

      const projectImages = gsap.utils.toArray<HTMLElement>(
        ".works-project-image",
        section
      );
      const projectTitles = gsap.utils.toArray<HTMLElement>(
        ".works-project-title",
        section
      );
      const projectDescriptions = gsap.utils.toArray<HTMLElement>(
        ".works-project-description",
        section
      );
      const projectCaptions = [...projectTitles, ...projectDescriptions];
      const lastProjectIndex = filteredProjects.length - 1;

      // Lingkaran progres PER HALAMAN: tiap proyek mengisi cincin dari kosong
      // ke penuh selama rentang scroll miliknya sendiri, lalu kosong lagi di
      // halaman berikutnya (kategori 1 proyek = penuh). Batas halaman sama
      // dengan pergantian angka/title (Math.round).
      const ring = ringRef.current;
      const setRing = (progress: number) => {
        if (!ring) return;
        let fraction = 1;

        if (lastProjectIndex > 0) {
          const position = progress * lastProjectIndex;
          const page = Math.max(
            0,
            Math.min(lastProjectIndex, Math.round(position))
          );
          const from = page === 0 ? 0 : page - 0.5;
          const to = page === lastProjectIndex ? lastProjectIndex : page + 0.5;

          fraction = Math.max(0, Math.min(1, (position - from) / (to - from)));
        }

        ring.style.strokeDashoffset = `${RING_C * (1 - fraction)}`;
      };
      setRing(0);

      // Animasi teks. Title: tiap karakter muncul membesar + opacity naik.
      // Deskripsi: tiap baris muncul dari kanan bawah. Baris dideteksi dari
      // posisi vertikal kata (offsetTop) karena pembungkusan teks dinamis.
      const titleChars = projectTitles.map((title) =>
        gsap.utils.toArray<HTMLElement>(".works-title-char", title)
      );
      const descLines = projectDescriptions.map((description) => {
        const lines: HTMLElement[][] = [];
        let lineTop = Number.NEGATIVE_INFINITY;

        gsap.utils
          .toArray<HTMLElement>(".works-desc-word", description)
          .forEach((word) => {
            if (Math.abs(word.offsetTop - lineTop) > 4) {
              lines.push([]);
              lineTop = word.offsetTop;
            }
            lines[lines.length - 1].push(word);
          });

        return lines;
      });
      const allTitleChars = titleChars.flat();
      const allDescWords = descLines.flat(2);

      // Penempatan bintang (px, relatif ke blok teks masing-masing), satu
      // bintang per teks di baris pertama.
      // Title (rata kiri): di awal baris pertama (kiri-atas).
      // Deskripsi (rata kanan): di ujung baris pertama (kanan-atas).
      // Offset dalam em supaya ikut skala font (clamp) di semua ukuran layar.
      const placeStar = (host: HTMLElement, x: number, y: number) => {
        const star = host.querySelector<HTMLElement>(".works-star");

        if (!star) return;
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
      };

      projectTitles.forEach((title, index) => {
        const chars = titleChars[index];

        if (!chars?.length) return;

        const first = chars[0];
        const fs = parseFloat(getComputedStyle(title).fontSize);

        placeStar(
          title,
          first.offsetLeft - 0.37 * fs,
          first.offsetTop - 0.16 * fs
        );
      });

      projectDescriptions.forEach((description, index) => {
        const lines = descLines[index];

        if (!lines?.length) return;

        const firstLine = lines[0];
        const endOfFirst = firstLine[firstLine.length - 1];
        const fs = parseFloat(getComputedStyle(description).fontSize);

        placeStar(
          description,
          endOfFirst.offsetLeft + endOfFirst.offsetWidth + 0.3 * fs,
          firstLine[0].offsetTop - 0.25 * fs
        );
      });

      const addTitleIn = (
        tl: gsap.core.Timeline,
        index: number,
        at: number,
        duration: number,
        total: number
      ) => {
        if (!titleChars[index]?.length) return;
        tl.fromTo(
          titleChars[index],
          { autoAlpha: 0, scale: 0.55 },
          {
            autoAlpha: 1,
            scale: 1,
            duration,
            ease: "power2.out",
            stagger: { amount: total },
            immediateRender: false,
          },
          at
        );
      };
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

      // Image stretch: gambar aktif memenuhi kartu (scaleY 1), sisanya
      // "terlipat" ke bawah kartu (scaleY 0, origin bawah) menunggu giliran.
      gsap.set(projectCaptions, { autoAlpha: 0 });
      gsap.set([projectTitles[0], projectDescriptions[0]], { autoAlpha: 1 });
      gsap.set(projectImages, {
        scaleY: (i) => (i === 0 ? 1 : 0),
        transformOrigin: "50% 100%",
      });

      const updateActiveProject = (index: number) => {
        const nextIndex = Math.max(0, Math.min(lastProjectIndex, index));

        if (activeProjectIndexRef.current !== nextIndex) {
          activeProjectIndexRef.current = nextIndex;
          setActiveProjectIndex(nextIndex);
        }
      };

      const showProjectImmediately = (index: number) => {
        updateActiveProject(index);
        gsap.set(projectImages, {
          scaleY: (i) => (i === index ? 1 : 0),
          transformOrigin: "50% 100%",
        });
        gsap.set(projectCaptions, { autoAlpha: 0, y: 0 });
        gsap.set(
          [projectTitles[index], projectDescriptions[index]],
          { autoAlpha: 1 }
        );
      };

      // Keadaan awal animasi teks + intro proyek pertama (diputar sekali saat
      // section mulai masuk layar). Mode reduced-motion: teks langsung tampil.
      const textMedia = gsap.matchMedia();

      textMedia.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(allTitleChars, {
          autoAlpha: 0,
          scale: 0.55,
          transformOrigin: "50% 80%",
        });
        gsap.set(allDescWords, { autoAlpha: 0, x: 28, y: 22 });

        const intro = gsap.timeline({ paused: true });
        addTitleIn(intro, 0, 0, 0.7, 0.55);
        addDescIn(intro, 0, 0.3, 0.8, 0.14);

        if (section.getBoundingClientRect().top < window.innerHeight * 0.2) {
          intro.play();
        } else {
          ScrollTrigger.create({
            trigger: section,
            start: "top 20%",
            once: true,
            onEnter: () => intro.play(),
          });
        }
      });

      const projectMedia = gsap.matchMedia();

      if (lastProjectIndex > 0) {
        const scrollTriggerOptions = {
          trigger: section,
          start: () =>
            `top+=${Math.round(PIN_OFFSET_Y * window.innerHeight)} top`,
          end: () =>
            `+=${lastProjectIndex * Math.max(window.innerHeight, 600)}`,
          invalidateOnRefresh: true,
        };

        projectMedia.add("(prefers-reduced-motion: no-preference)", () => {
          const timeline = gsap.timeline({
            scrollTrigger: {
              ...scrollTriggerOptions,
              scrub: 0.8,
              onUpdate: (self) => {
                setRing(self.progress);
                updateActiveProject(
                  Math.round(self.progress * lastProjectIndex)
                );
              },
            },
          });

          // Referensi "Image Stretch Transition":
          // - gambar lama terjepit ke ATAS (scaleY 1 -> 0, origin atas)
          // - gambar baru terentang dari BAWAH (scaleY 0 -> 1, origin bawah)
          // Tinggi keduanya selalu berjumlah 100% sehingga batasnya naik
          // mulus tanpa fade/clip. Gambar ikut tergepit (bukan di-crop).
          const HOLD = 0.2; // jeda diam sebelum & sesudah transisi
          const SPAN = 1 - HOLD * 2;
          const EASE = "power3.inOut";

          for (let index = 1; index <= lastProjectIndex; index += 1) {
            const start = index - 1 + HOLD;

            timeline.fromTo(
              projectImages[index - 1],
              { scaleY: 1, transformOrigin: "50% 0%" },
              {
                scaleY: 0,
                transformOrigin: "50% 0%",
                duration: SPAN,
                ease: EASE,
                immediateRender: false,
              },
              start
            );
            timeline.fromTo(
              projectImages[index],
              { scaleY: 0, transformOrigin: "50% 100%" },
              {
                scaleY: 1,
                transformOrigin: "50% 100%",
                duration: SPAN,
                ease: EASE,
                immediateRender: false,
              },
              start
            );
            timeline.to(
              [projectTitles[index - 1], projectDescriptions[index - 1]],
              {
                autoAlpha: 0,
                y: -18,
                duration: SPAN * 0.4,
                ease: "none",
              },
              start + SPAN * 0.2
            );
            // Wadah title & deskripsi langsung tampil; yang beranimasi adalah
            // karakter title (membesar + opacity) dan baris deskripsi.
            const enterAt = start + SPAN * 0.45;

            timeline.fromTo(
              [projectTitles[index], projectDescriptions[index]],
              { autoAlpha: 0 },
              {
                autoAlpha: 1,
                duration: SPAN * 0.02,
                ease: "none",
                immediateRender: false,
              },
              enterAt
            );
            addTitleIn(timeline, index, enterAt, SPAN * 0.2, SPAN * 0.25);
            addDescIn(
              timeline,
              index,
              enterAt + SPAN * 0.08,
              SPAN * 0.2,
              SPAN * 0.07
            );
          }
          // padding agar progres scroll 0..1 = seluruh rangkaian proyek
          timeline.set({}, {}, lastProjectIndex);
        });

        projectMedia.add("(prefers-reduced-motion: reduce)", () => {
          const trigger = ScrollTrigger.create({
            ...scrollTriggerOptions,
            onUpdate: (self) => {
              setRing(self.progress);
              showProjectImmediately(
                Math.round(self.progress * lastProjectIndex)
              );
            },
          });

          setRing(trigger.progress);
          showProjectImmediately(
            Math.round(trigger.progress * lastProjectIndex)
          );
        });
      }

      const cursorMedia = gsap.matchMedia();

      cursorMedia.add(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const pointer = pointerRef.current;

          // Efek ini dibuat ulang setiap kategori diganti. Kalau kursor sudah
          // berada di dalam section (mis. habis klik nav), pointerenter tidak
          // terpicu lagi, jadi langsung tampilkan di posisi terakhirnya.
          gsap.set(cursor, {
            xPercent: -50,
            yPercent: -50,
            x: pointer.x,
            y: pointer.y,
            autoAlpha: pointer.inside ? 1 : 0,
            scale: pointer.inside ? CURSOR_BASE_SCALE : 0.3,
          });
          gsap.set(viewText, { autoAlpha: 0, scale: 0.8 });

          const spin = gsap.to(cursorIcon, {
            rotation: 360,
            duration: 8,
            repeat: -1,
            ease: "none",
          });
          const xTo = gsap.quickTo(cursor, "x", {
            duration: 0.28,
            ease: "power3.out",
          });
          const yTo = gsap.quickTo(cursor, "y", {
            duration: 0.28,
            ease: "power3.out",
          });

          const moveCursor = (event: PointerEvent) => {
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            pointer.inside = true;
            xTo(event.clientX);
            yTo(event.clientY);
          };
          const showCursor = (event: PointerEvent) => {
            moveCursor(event);
            gsap.to(cursor, {
              autoAlpha: 1,
              scale: CURSOR_BASE_SCALE,
              duration: 0.3,
              ease: "back.out(1.7)",
            });
          };
          const hideCursor = () => {
            pointer.inside = false;
            gsap.to(cursor, {
              autoAlpha: 0,
              scale: 0.3,
              duration: 0.25,
              ease: "power2.in",
            });
          };
          const showViewText = () => {
            gsap.to(cursor, {
              scale: 1,
              duration: 0.35,
              ease: "back.out(1.5)",
              overwrite: "auto",
            });
            gsap.to(viewText, {
              autoAlpha: 1,
              scale: 1,
              duration: 0.2,
              ease: "power2.out",
            });
          };
          const hideViewText = () => {
            gsap.to(cursor, {
              scale: CURSOR_BASE_SCALE,
              duration: 0.25,
              ease: "power2.out",
              overwrite: "auto",
            });
            gsap.to(viewText, {
              autoAlpha: 0,
              scale: 0.8,
              duration: 0.15,
              ease: "power2.in",
            });
          };

          section.addEventListener("pointermove", moveCursor);
          section.addEventListener("pointerenter", showCursor);
          section.addEventListener("pointerleave", hideCursor);
          preview.addEventListener("pointerenter", showViewText);
          preview.addEventListener("pointerleave", hideViewText);

          return () => {
            section.removeEventListener("pointermove", moveCursor);
            section.removeEventListener("pointerenter", showCursor);
            section.removeEventListener("pointerleave", hideCursor);
            preview.removeEventListener("pointerenter", showViewText);
            preview.removeEventListener("pointerleave", hideViewText);
            spin.kill();
          };
        }
      );

      return () => {
        textMedia.revert();
        projectMedia.revert();
        cursorMedia.revert();
      };
    },
    {
      scope: sectionRef,
      dependencies: [activeCategory, layoutKey],
      revertOnUpdate: true,
    }
  );

  return (
    <section
      ref={sectionRef}
      id="works"
      aria-label="Karya"
      className="relative isolate w-full [@media(pointer:fine)]:cursor-none"
      style={{
        height: `${
          Math.max(filteredProjects.length * 100, 130) + WALL_EXTRA_Y * 100
        }svh`,
        minHeight: `${
          Math.max(filteredProjects.length * 600, 780) + WALL_EXTRA_Y * 600
        }px`,
      }}
    >
      <div
        className="sticky flex w-full items-start justify-center overflow-hidden"
        style={{
          top: `calc(-100svh * ${PIN_OFFSET_Y})`,
          height: `calc(100svh * ${1 + WALL_EXTRA_Y})`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 z-0 h-full -translate-x-1/2"
          style={{ width: `calc(100svh * ${WALL_RATIO * WALL_STRETCH_X})` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/greek-wall.webp"
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full select-none"
          />
        </div>

        {/*
          Frame + kartu di tengah layar, ukurannya mengikuti tinggi layar:
          frame 99% tinggi layar (kotak y 19.3%-118.3%, bagian merah yang
          terlihat sekitar y 30.7%-103.3%, di bawah ornamen kunci dan di atas
          menu kategori; posisi ini dibaca saat pin aktif, ketika stage sudah
          naik sebesar PIN_OFFSET_Y), rasio 465:647. Lubang frame (persen dari kotak frame)
          x 23.6%-74.8%, y 20.6%-79.1% -> kartu dibuat lebih besar sekitar 3-4%
          agar tepinya tertutup tebal frame.
        */}
        <article
          aria-label="Pratinjau proyek"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-svh"
        >
          <div className="absolute left-1/2 top-[19.3%] aspect-[465/647] h-[99%] -translate-x-1/2">
            <div
              ref={previewRef}
              aria-label="Area pratinjau karya"
              className="pointer-events-auto absolute left-[19.6%] top-[17.1%] h-[64.5%] w-[59.2%] overflow-hidden bg-[#d5d5d5]"
            >
              {filteredProjects.map((project, index) => (
                <div
                  key={project.title}
                  aria-hidden={index !== activeProjectIndex}
                  className="works-project-image absolute inset-0 will-change-transform"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image}
                    alt={`${project.title} project preview`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full select-none object-cover"
                  />
                </div>
              ))}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frame-red.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
            />
          </div>
            <nav
              aria-label="Kategori proyek"
              className="pointer-events-auto absolute inset-x-0 top-[109.5%] flex -translate-y-1/2 items-center justify-center gap-[clamp(8px,1.6vw,24px)]"
            >
              {CATEGORIES.map((category) => {
                const isActive = category.id === activeCategory;

                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      activeProjectIndexRef.current = 0;
                      setActiveProjectIndex(0);
                      setActiveCategory(category.id);
                      const section = sectionRef.current;

                      if (section) {
                        window.scrollTo({
                          top:
                            section.getBoundingClientRect().top +
                            window.scrollY +
                            PIN_OFFSET_Y * window.innerHeight,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="group inline-flex items-center gap-1.5 font-acerok text-[clamp(10px,1.05vw,16px)] leading-none text-black/45 transition-colors duration-300 hover:text-black focus-visible:text-black focus-visible:outline-none"
                  >
                    <span
                      className={
                        isActive
                          ? "text-black"
                          : "transition-transform duration-300 group-hover:-translate-x-1"
                      }
                    >
                      {category.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`transition-all duration-300 ease-out ${
                        isActive
                          ? "translate-x-0 opacity-100"
                          : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/icon-custom/Plus.svg"
                        alt=""
                        className="h-[clamp(11px,1.05vw,16px)] w-[clamp(11px,1.05vw,16px)] invert transition-transform duration-500 ease-out group-hover:rotate-180 group-focus-visible:rotate-180"
                      />
                    </span>
                  </button>
                );
              })}
            </nav>
        </article>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-svh">
          {/*
            Title (kiri): rata kiri, tiap kata di barisnya sendiri, italic,
            dengan bintang di pojok kiri-atas dan kanan-bawah blok teks.
            Semua title menumpuk di sel grid yang sama.
          */}
          <div
            aria-live="polite"
            className="absolute left-[4.2vw] z-20 grid w-[16vw]"
            style={{ top: pinTop(TEXT_TOP) }}
          >
            {filteredProjects.map((project, index) => (
              <h2
                key={project.title}
                aria-hidden={index !== activeProjectIndex}
                aria-label={project.title}
                className="works-project-title relative col-start-1 row-start-1 w-min justify-self-start font-acerok text-[clamp(16px,1.95vw,38px)] font-normal italic uppercase leading-[1.1] tracking-[0.01em] text-left"
                style={{ color: INK }}
              >
                <span aria-hidden="true" className="block">
                  {project.title.split(" ").map((word, wordIndex, words) => (
                    <Fragment key={wordIndex}>
                      <span className="inline-block whitespace-nowrap">
                        {word.split("").map((char, charIndex) => (
                          <span
                            key={charIndex}
                            className="works-title-char inline-block will-change-transform"
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                      {wordIndex < words.length - 1 ? " " : null}
                    </Fragment>
                  ))}
                </span>
                <Star />
              </h2>
            ))}
          </div>

          {/*
            Deskripsi (kanan): rata kanan, italic, kolom sempit sehingga
            terpecah jadi 3 baris pendek; bintang di pojok kanan-atas dan
            kiri-bawah blok teks.
          */}
          <div
            aria-live="polite"
            className="absolute right-[2.9vw] z-20 grid w-[15.5vw]"
            style={{ top: pinTop(TEXT_TOP) }}
          >
            {filteredProjects.map((project, index) => (
              <p
                key={project.title}
                aria-hidden={index !== activeProjectIndex}
                className="works-project-description relative col-start-1 row-start-1 justify-self-end font-switzer text-[clamp(11px,1.4vw,26px)] italic leading-[1.2] tracking-[-0.01em] text-right"
                style={{ color: INK }}
              >
                <span className="block">
                  {project.description
                    .split(" ")
                    .map((word, wordIndex, words) => (
                      <Fragment key={wordIndex}>
                        <span className="works-desc-word inline-block will-change-transform">
                          {word}
                        </span>
                        {wordIndex < words.length - 1 ? " " : null}
                      </Fragment>
                    ))}
                </span>
                <Star />
              </p>
            ))}
          </div>

          <div
            role="img"
            aria-label={`Proyek ${activeProjectIndex + 1} dari ${filteredProjects.length}`}
            className="absolute z-20 flex aspect-square w-[clamp(56px,5.4vw,104px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center text-black"
            style={{ left: "91.5%", top: pinTop(75.5) }}
          >
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full -rotate-90"
            >
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
              <circle
                ref={ringRef}
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={filteredProjects.length > 1 ? RING_C : 0}
              />
            </svg>
            <span
              aria-hidden="true"
              className="relative font-acerok text-[clamp(14px,1.75vw,34px)] font-light leading-none"
            >
              {String(activeProjectIndex + 1).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[70] hidden select-none will-change-transform [@media(pointer:fine)]:block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={cursorIconRef}
          src="/cursorFollowing.svg"
          alt=""
          className="h-[105px] w-[105px] select-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={viewTextRef}
          src="/view-text.png"
          alt=""
          className="absolute left-1/2 top-1/2 h-auto w-[54px] -translate-x-1/2 -translate-y-1/2 select-none"
        />
      </div>
    </section>
  );
}