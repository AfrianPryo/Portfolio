"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Ganti isi daftar ini dengan skill final. Jumlah item menentukan panjang scroll
// (1 skill = 1 layar). Judul yang panjang otomatis turun ke baris berikutnya.
// `photo` = gambar yang mengikuti cursor (sementara dummy, ganti dengan foto asli).
const SKILLS = [
  {
    title: "UI/UX DESIGN",
    photo: "/skills/dummy-1.jpg",
    description:
      "Merancang antarmuka aplikasi dan web dengan Figma, dari riset sampai prototipe.",
  },
  {
    title: "FULLSTACK DEVELOPMENT",
    photo: "/skills/dummy-2.jpg",
    description:
      "Membangun aplikasi web modern dengan React, Laravel, dan MySQL, dari tampilan sampai database.",
  },
  {
    title: "GRAPHIC DESIGN",
    photo: "/skills/dummy-3.jpg",
    description:
      "Mengolah visual dengan Photoshop, Illustrator, Affinity, dan Canva untuk berbagai kebutuhan.",
  },
  {
    title: "MOTION & INTERACTION",
    photo: "/skills/dummy-4.jpg",
    description:
      "Membuat animasi dan interaksi yang halus dengan After Effects, Blender, dan Framer.",
  },
];

// Background GIF (taruh file di /public/skills-bg.gif).
const BG_GIF = "/skills-bg.gif";

// Foto yang mengikuti cursor: kemiringan dasar & batas kemiringan saat digerakkan.
const PHOTO_TILT = -4;
const PHOTO_TILT_MAX = 14;
// Perspektif 3D: batas miring (derajat) mengikuti arah gerak cursor.
const PHOTO_PERSPECTIVE = 900;
const PHOTO_TILT_3D_MAX = 12;
// Lensa barrel berlaku di SELURUH section (pusat = tengah stage); hanya foto
// yang mengikuti cursor yang melewatinya. Makin jauh dari tengah, makin kuat
// lengkungnya, dan foto miring (permukaan cembung) sampai sebesar ini di tepi.
const PHOTO_SURFACE_TILT = 26;
// Jangkauan lensa: makin besar, makin cepat lengkung/miring terasa dari tengah.
const LENS_REACH = 1.3;
// Kekuatan barrel (SVG feDisplacementMap): dasar, maks yang dikodekan di peta.
const BARREL_BASE = 0.26;
const BARREL_MAX = 0.4;

// ---- Transisi ke section Works ----
// Setelah skill terakhir ada scroll tambahan (COVER_SCREENS layar) tempat
// tangga merah tumbuh. Tangga itu digambar oleh section Works pada lapisan
// fixed seukuran layar (bukan di sini), jadi tidak bergantung pada geometri
// section ini. Works naik COVER_LEAD ekstra supaya fase tangga selesai tepat
// saat Works menempel. Nilai (COVER_SCREENS - COVER_LEAD) harus sama dengan
// STAIR_IN_SCREENS di Works.
const COVER_SCREENS = 1.8;
const COVER_LEAD = 0.1;

// Peta displacement radial untuk lensa barrel seukuran stage. Piksel keluaran
// mengambil sampel dari titik yang lebih jauh dari pusat, sehingga isi menyusut
// ke tepi dan bentuk foto melengkung seperti tong. `aspect` = tinggi / lebar.
function createBarrelMap(aspect: number) {
  const w = 128;
  const h = Math.max(16, Math.round(w * aspect));
  const canvas = document.createElement("canvas");

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  const data = ctx.createImageData(w, h);

  for (let j = 0; j < h; j += 1) {
    for (let i = 0; i < w; i += 1) {
      const u = ((i + 0.5) / w) * 2 - 1;
      const v = ((j + 0.5) / h) * 2 - 1;
      // Linear terhadap jarak (bukan kuadrat) supaya lensa terasa lebih luas.
      const r2 = Math.sqrt(u * u + v * v);
      const o = (j * w + i) * 4;

      data.data[o] = Math.round((0.5 + (BARREL_MAX * r2 * u) / 2) * 255);
      data.data[o + 1] = Math.round(
        (0.5 + (BARREL_MAX * r2 * v * aspect) / 2) * 255,
      );
      data.data[o + 2] = 128;
      data.data[o + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL();
}

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef(0);
  const prevPhotoRef = useRef(0);
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
        section,
      );
      const captions = [...titles, ...descriptions];
      const lastIndex = SKILLS.length - 1;

      const titleChars = titles.map((title) =>
        gsap.utils.toArray<HTMLElement>(".skills-char", title),
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
        amp = 1,
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
          at,
        );
      };
      const glitchOut = (
        tl: gsap.core.Timeline,
        target: gsap.TweenTarget,
        at: number,
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
          at,
        );
      };

      // Title: karakter muncul ACAK dengan glitch.
      const addTitleIn = (
        tl: gsap.core.Timeline,
        index: number,
        at: number,
        spread: number,
      ) => {
        const chars = titleChars[index];

        if (!chars?.length) return;

        const order = gsap.utils.shuffle(chars.map((_, i) => i));

        chars.forEach((char, i) => {
          glitchTo(
            tl,
            char,
            at + (order[i] / Math.max(chars.length - 1, 1)) * spread,
          );
        });
      };
      // Deskripsi: tiap baris muncul dari kanan bawah (sama dengan Works).
      const addDescIn = (
        tl: gsap.core.Timeline,
        index: number,
        at: number,
        duration: number,
        gap: number,
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
            at + lineIndex * gap,
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
      // layar scroll = satu skill. Rentangnya hanya (jumlah skill - 1) layar;
      // sisa scroll (COVER_SCREENS) dipakai transisi tangga merah.
      const projectMedia = gsap.matchMedia();

      if (lastIndex > 0) {
        const scrollTriggerOptions = {
          trigger: section,
          start: "top top",
          end: () => `+=${lastIndex * window.innerHeight}`,
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
            glitchOut(
              timeline,
              [titles[index - 1], descriptions[index - 1]],
              start,
            );

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
              enterAt,
            );
            addTitleIn(timeline, index, enterAt, SPAN * 0.24);
            addDescIn(
              timeline,
              index,
              enterAt + SPAN * 0.08,
              SPAN * 0.2,
              SPAN * 0.07,
            );
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
    },
  );

  // ===== Transisi warna + entrance background =====
  // Experience berlatar hampir hitam (#0a0303) sedangkan GIF merah terang.
  // Agar tidak ada "tepi" tajam, ada tiga lapis yang dibuat berurutan dan
  // semuanya ber-scrub (dibalik otomatis saat scroll ke atas):
  //  1) GIF memudar masuk dari gelap selagi section naik (top bottom -> top 15%)
  //     dengan easing sine.inOut (tanpa awal/akhir yang tiba-tiba).
  //  2) Scrim gelap di tepi atas (gradien ber-easing banyak titik) bertahan
  //     selama section naik, lalu pelan-pelan lenyap SETELAH section menempel
  //     (70% tinggi layar scroll tambahan), jadi merah "mekar" dari bawah.
  //  3) Entrance bertempo (bukan scrub): GIF mulai agak diperbesar (zoom-in)
  //     lalu mengendap ke ukuran normal begitu section mulai terlihat.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const bg = section?.querySelector<HTMLElement>(".skills-bg");
      const zoom = section?.querySelector<HTMLElement>(".skills-bg-zoom");
      const fade = section?.querySelector<HTMLElement>(".skills-top-fade");

      if (!section || !bg || !zoom || !fade) return;

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          bg,
          { opacity: 0 },
          {
            opacity: 1,
            ease: "sine.inOut",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "top 15%",
              scrub: 0.6,
            },
          },
        );

        gsap.fromTo(
          fade,
          { opacity: 1 },
          {
            opacity: 0,
            ease: "sine.inOut",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * 0.7}`,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );

        gsap.fromTo(
          zoom,
          { scale: 1.25 },
          {
            scale: 1,
            duration: 2.4,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(bg, { opacity: 1 });
        gsap.set(zoom, { scale: 1 });
        gsap.set(fade, { opacity: 0 });
      });

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  // ===== Foto yang mengikuti cursor =====
  // Hanya untuk pointer halus & tanpa reduced-motion. Posisi diikuti dengan
  // easing (quickTo); foto miring (2D + perspektif 3D) mengikuti arah/kecepatan
  // gerak, dan efek barrel distortion menguat saat cursor bergerak cepat.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const photo = section?.querySelector<HTMLElement>(".skills-photo");
      const inner = section?.querySelector<HTMLElement>(".skills-photo-inner");
      const barrel = section?.querySelector<SVGFilterElement>("#skills-barrel");
      const map =
        section?.querySelector<SVGFEImageElement>("#skills-barrel-map");
      const disp = section?.querySelector<SVGFEDisplacementMapElement>(
        "#skills-barrel-disp",
      );
      // Layer seukuran stage: tempat filter lensa barrel dipasang.
      const layer = photo?.parentElement;

      if (!section || !photo || !inner || !barrel || !map || !disp || !layer)
        return;

      // Alias non-null untuk dipakai di function declaration (hoisted).
      const photoEl: HTMLElement = photo;
      const innerEl: HTMLElement = inner;
      const layerEl: HTMLElement = layer;
      const media = gsap.matchMedia();

      media.add(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          gsap.set(photo, {
            xPercent: -50,
            yPercent: -50,
            rotation: PHOTO_TILT,
            transformPerspective: PHOTO_PERSPECTIVE,
          });
          gsap.set(inner, { autoAlpha: 0, scale: 0.6 });

          // ----- Barrel distortion (lensa seluas section) -----
          const barrelState = { k: BARREL_BASE };
          let width = layer.offsetWidth;
          let mapTimer: number | undefined;

          const applyBarrel = () => {
            disp.setAttribute(
              "scale",
              String((width * barrelState.k) / BARREL_MAX),
            );
          };
          const applyMap = () => {
            map.setAttribute(
              "href",
              createBarrelMap(
                layer.offsetHeight / Math.max(layer.offsetWidth, 1),
              ),
            );
          };
          const applySize = () => {
            width = layer.offsetWidth;

            const height = layer.offsetHeight;

            barrel.setAttribute("width", String(width));
            barrel.setAttribute("height", String(height));
            map.setAttribute("width", String(width));
            map.setAttribute("height", String(height));
            applyBarrel();
            // Peta bergantung pada rasio stage, jadi dibuat ulang saat resize.
            window.clearTimeout(mapTimer);
            mapTimer = window.setTimeout(applyMap, 120);
          };

          applyMap();
          applySize();
          // Filter displacement di layer seukuran stage itu mahal: hanya dipasang
          // selama foto kursor tampil (lihat show/hide), dan dilewati di
          // perangkat dengan CPU lemah (sama seperti Works).
          const lowPower = (navigator.hardwareConcurrency ?? 8) <= 4;

          const resizeObserver = new ResizeObserver(applySize);

          resizeObserver.observe(layer);

          const xTo = gsap.quickTo(photo, "x", {
            duration: 0.8,
            ease: "power3.out",
          });
          const yTo = gsap.quickTo(photo, "y", {
            duration: 0.8,
            ease: "power3.out",
          });
          const rotTo = gsap.quickTo(photo, "rotation", {
            duration: 0.9,
            ease: "power3.out",
          });
          const rotXTo = gsap.quickTo(photo, "rotationX", {
            duration: 0.9,
            ease: "power3.out",
          });
          const rotYTo = gsap.quickTo(photo, "rotationY", {
            duration: 0.9,
            ease: "power3.out",
          });
          const kTo = gsap.quickTo(barrelState, "k", {
            duration: 0.7,
            ease: "power3.out",
            onUpdate: applyBarrel,
          });

          let visible = false;
          let lastX = 0;
          let lastY = 0;
          let settle: number | undefined;
          // Posisi foto relatif terhadap tengah stage, -1..1 (permukaan cembung:
          // di kanan sisi kanan menjauh, di bawah sisi bawah menjauh).
          let surfaceY = 0;
          let surfaceX = 0;

          const setSurface = (x: number, y: number) => {
            const rect = layer.getBoundingClientRect();

            surfaceY = gsap.utils.clamp(
              -1,
              1,
              ((x / rect.width) * 2 - 1) * LENS_REACH,
            );
            surfaceX = gsap.utils.clamp(
              -1,
              1,
              -((y / rect.height) * 2 - 1) * LENS_REACH,
            );
          };

          const trigger = ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
              if (!self.isActive) hide();
            },
          });

          function show(
            x: number,
            y: number,
            clientX: number,
            clientY: number,
          ) {
            if (visible || !trigger.isActive) return;

            visible = true;
            if (!lowPower) layerEl.style.filter = "url(#skills-barrel)";
            lastX = clientX;
            lastY = clientY;
            // Mulai dari posisi cursor (tidak meluncur dari pojok).
            setSurface(x, y);
            gsap.set(photoEl, {
              x,
              y,
              rotationY: surfaceY * PHOTO_SURFACE_TILT,
              rotationX: surfaceX * PHOTO_SURFACE_TILT,
            });
            // Muncul dengan lensa barrel kuat yang mengendur ke nilai dasar.
            barrelState.k = BARREL_MAX * 0.85;
            applyBarrel();
            kTo(BARREL_BASE);
            gsap.to(innerEl, {
              autoAlpha: 1,
              scale: 1,
              duration: 0.6,
              ease: "power3.out",
              overwrite: true,
            });
          }

          function hide() {
            if (!visible) return;

            visible = false;
            gsap.to(innerEl, {
              autoAlpha: 0,
              scale: 0.6,
              duration: 0.35,
              ease: "power2.in",
              overwrite: true,
              onComplete: () => {
                // Lepas filter setelah foto benar-benar hilang (kecuali sudah tampil lagi).
                if (!visible) layerEl.style.filter = "";
              },
            });
          }

          const onMove = (event: PointerEvent) => {
            const rect = layer.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            show(x, y, event.clientX, event.clientY);
            if (!visible) return;

            const dx = event.clientX - lastX;
            const dy = event.clientY - lastY;

            lastX = event.clientX;
            lastY = event.clientY;

            setSurface(x, y);
            xTo(x);
            yTo(y);
            rotTo(
              gsap.utils.clamp(
                PHOTO_TILT - PHOTO_TILT_MAX,
                PHOTO_TILT + PHOTO_TILT_MAX,
                PHOTO_TILT + dx * 0.6,
              ),
            );
            // Perspektif: sisi yang searah gerak "maju", seperti ditarik cursor.
            rotYTo(
              surfaceY * PHOTO_SURFACE_TILT +
                gsap.utils.clamp(
                  -PHOTO_TILT_3D_MAX,
                  PHOTO_TILT_3D_MAX,
                  dx * 0.6,
                ),
            );
            rotXTo(
              surfaceX * PHOTO_SURFACE_TILT +
                gsap.utils.clamp(
                  -PHOTO_TILT_3D_MAX,
                  PHOTO_TILT_3D_MAX,
                  -dy * 0.6,
                ),
            );
            // Makin cepat cursor bergerak, makin kuat lengkung barrel-nya.
            kTo(
              Math.min(
                BARREL_BASE + Math.hypot(dx, dy) * 0.004,
                BARREL_BASE + 0.14,
              ),
            );

            // Saat cursor berhenti, semuanya kembali ke posisi dasar.
            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
              rotTo(PHOTO_TILT);
              rotXTo(surfaceX * PHOTO_SURFACE_TILT);
              rotYTo(surfaceY * PHOTO_SURFACE_TILT);
              kTo(BARREL_BASE);
            }, 90);
          };

          section.addEventListener("pointermove", onMove, { passive: true });
          section.addEventListener("pointerleave", hide);

          return () => {
            window.clearTimeout(settle);
            section.removeEventListener("pointermove", onMove);
            section.removeEventListener("pointerleave", hide);
            window.clearTimeout(mapTimer);
            resizeObserver.disconnect();
            layer.style.filter = "";
            trigger.kill();
          };
        },
      );

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  // ===== Pergantian foto: image stretch (mengikuti skill aktif saat scroll) =====
  // Foto lama menyusut ke atas (scaleY 1 -> 0, titik tumpu di atas) sementara
  // foto baru melar dari bawah (scaleY 0 -> 1, titik tumpu di bawah). Tinggi
  // keduanya selalu berjumlah 100%, jadi batas pertemuannya naik dari bawah ke
  // atas dan isi foto ikut tertekan/meregang.
  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) return;

      const slides = gsap.utils.toArray<HTMLElement>(
        ".skills-photo-slide",
        section,
      );
      const prev = prevPhotoRef.current;
      const next = activeIndex;
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      prevPhotoRef.current = next;

      const settle = () => {
        slides.forEach((slide, i) => {
          gsap.set(slide, {
            autoAlpha: i === next ? 1 : 0,
            scaleY: i === next ? 1 : 0,
            zIndex: i === next ? 2 : 0,
            transformOrigin: "50% 50%",
          });
        });
      };

      // Hentikan transisi yang masih berjalan sebelum memulai yang baru.
      gsap.killTweensOf(slides);

      if (prev === next || !slides[next] || !slides[prev] || reduce) {
        settle();
        return;
      }

      const outgoing = slides[prev];
      const incoming = slides[next];

      slides.forEach((slide, i) => {
        if (i !== prev && i !== next) {
          gsap.set(slide, { autoAlpha: 0, scaleY: 0, zIndex: 0 });
        }
      });
      gsap.set(outgoing, {
        autoAlpha: 1,
        scaleY: 1,
        zIndex: 2,
        transformOrigin: "50% 0%",
      });
      gsap.set(incoming, {
        autoAlpha: 1,
        scaleY: 0,
        zIndex: 3,
        transformOrigin: "50% 100%",
      });

      const config = { duration: 0.7, ease: "power3.inOut" };

      gsap.to(outgoing, { scaleY: 0, ...config });
      gsap.to(incoming, {
        scaleY: 1,
        ...config,
        onComplete: () => {
          // Abaikan kalau skill sudah berganti lagi saat animasi berjalan.
          if (activeIndexRef.current === next) settle();
        },
      });
    },
    { scope: sectionRef, dependencies: [activeIndex] },
  );

  return (
    <section
      ref={sectionRef}
      id="skills"
      aria-labelledby="skills-heading"
      style={{
        // Works (sibling berikutnya) naik 1 layar + COVER_LEAD ke atas dan
        // menempel di atas stage ini tepat saat tangga merah sudah penuh,
        // SEBELUM stage ini mulai terangkat. Selisih COVER_LEAD jadi ruang
        // toleransi supaya tidak pernah ada celah hitam di bawah.
        marginBottom: `calc(-100svh - ${COVER_LEAD * 100}svh)`,
        // Tinggi = satu layar per skill + scroll tambahan untuk transisi
        // tangga merah ke Works.
        height: `${(SKILLS.length + COVER_SCREENS) * 100}svh`,
        minHeight: `${(SKILLS.length + COVER_SCREENS) * 600}px`,
      }}
      className="relative isolate bg-[#0a0303] text-white [&+*]:pointer-events-none [&+*]:relative [&+*]:z-10"
    >
      <h2 id="skills-heading" className="sr-only">
        Skills
      </h2>

      {/* Stage menempel (sticky) setinggi layar selama skill berganti.
          overflow-hidden ada di sini, bukan di section, supaya sticky tetap jalan. */}
      <div className="sticky top-0 h-svh min-h-screen w-full overflow-hidden">
        {/* Background GIF seukuran stage. Objek orang berada di tengah gambar,
            jadi object-cover + object-center menjaganya tetap di tengah layar
            di semua rasio. */}
        <div
          aria-hidden="true"
          className="skills-bg pointer-events-none absolute inset-0 z-0"
        >
          <div className="skills-bg-zoom absolute inset-0 will-change-transform">
            <Image
              src={BG_GIF}
              alt=""
              fill
              unoptimized
              priority
              draggable={false}
              sizes="100vw"
              className="select-none object-cover object-center"
            />
          </div>
        </div>

        {/* Scrim gelap di tepi atas: menyambung warna Experience (#0a0303) ke
            GIF. Gradien dengan banyak titik (kurva ease, bukan linear) supaya
            tidak ada pita/garis batas yang terlihat. Memudar hilang lewat GSAP
            setelah section menempel. */}
        <div
          aria-hidden="true"
          className="skills-top-fade pointer-events-none absolute inset-x-0 top-0 z-[5] h-[70svh]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,3,3,1) 0%, rgba(10,3,3,0.987) 8%, rgba(10,3,3,0.953) 15.5%, rgba(10,3,3,0.894) 22.5%, rgba(10,3,3,0.815) 29%, rgba(10,3,3,0.725) 35.5%, rgba(10,3,3,0.627) 41.5%, rgba(10,3,3,0.529) 47%, rgba(10,3,3,0.431) 53%, rgba(10,3,3,0.333) 59%, rgba(10,3,3,0.243) 65%, rgba(10,3,3,0.162) 71%, rgba(10,3,3,0.094) 77.5%, rgba(10,3,3,0.041) 84.5%, rgba(10,3,3,0.012) 92%, rgba(10,3,3,0) 100%)",
          }}
        />

        {/* Filter barrel distortion untuk foto yang mengikuti cursor (peta
            displacement dan ukuran diisi dari JS). */}
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          className="pointer-events-none absolute"
        >
          <filter
            id="skills-barrel"
            x="0"
            y="0"
            width="300"
            height="225"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              id="skills-barrel-map"
              x="0"
              y="0"
              width="300"
              height="225"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              id="skills-barrel-disp"
              in="SourceGraphic"
              in2="map"
              scale="60"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        {/* Foto yang mengikuti cursor (dummy dulu). Layer = seukuran stage, tempat
            filter lensa barrel (hanya foto yang melewatinya, teks/background
            tidak). Wrapper foto = posisi, miring & perspektif (GSAP quickTo),
            inner = muncul/hilang, frame = bingkai, slide = satu foto per skill (image stretch saat
            scroll). Tinta merah dari overlay multiply supaya foto asli nanti
            tetap menyatu dengan tema. */}
        <div
          aria-hidden="true"
          className="skills-photo-layer pointer-events-none absolute inset-0 z-[15]"
        >
          <div className="skills-photo absolute left-0 top-0 w-[clamp(180px,21vw,380px)] will-change-transform">
            <div className="skills-photo-inner invisible">
              <div className="skills-photo-frame relative isolate aspect-[4/3] overflow-hidden bg-[#1a0505]">
                {SKILLS.map((skill) => (
                  <div
                    key={skill.photo}
                    className="skills-photo-slide invisible absolute inset-0 overflow-hidden will-change-transform"
                  >
                    <Image
                      src={skill.photo}
                      alt=""
                      fill
                      unoptimized
                      sizes="21vw"
                      draggable={false}
                      className="skills-photo-img select-none object-cover contrast-125 grayscale"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 z-10 bg-[#B30814] mix-blend-multiply" />
                <div className="absolute inset-0 z-10 bg-[#B30814]/25 mix-blend-screen" />
              </div>
            </div>
          </div>
        </div>

        {/* Title (TEPI KIRI): rata kiri, menempel di tepi kiri layar. Semua skill
            menumpuk di sel grid yang sama, menempel dari ATAS supaya baris
            pertama selalu sejajar dengan deskripsi. Mobile: rata tengah di
            atas objek. */}
        <div
          aria-live="polite"
          className="absolute left-[4%] top-[47%] z-20 grid w-[34%] text-left max-sm:left-6 max-sm:top-[14%] max-sm:w-[calc(100%-3rem)] max-sm:text-center"
        >
          {SKILLS.map((skill, index) => (
            <h3
              key={skill.title}
              aria-hidden={index !== activeIndex}
              aria-label={skill.title}
              className="skills-title col-start-1 row-start-1 font-acerok text-[clamp(24px,3.2vw,62px)] font-normal uppercase leading-[0.92] tracking-[-0.07em] text-left text-[#ff6a5c] [text-shadow:0_2px_20px_rgba(10,3,3,0.45)] max-sm:text-center max-sm:text-[clamp(26px,8vw,40px)]"
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

        {/* Deskripsi (TEPI KANAN): rata kanan, menempel di tepi kanan layar,
            kolom sempit sehingga terpecah jadi beberapa baris pendek.
            Mobile: rata tengah di bawah objek. */}
        <div
          aria-live="polite"
          className="absolute right-[4%] top-[47.5%] z-20 grid w-[27%] max-sm:bottom-[12%] max-sm:left-1/2 max-sm:right-auto max-sm:top-auto max-sm:w-[min(66vw,260px)] max-sm:-translate-x-1/2 max-sm:text-center"
        >
          {SKILLS.map((skill, index) => (
            <p
              key={skill.title}
              aria-hidden={index !== activeIndex}
              className="skills-desc col-start-1 row-start-1 text-right font-switzer text-[clamp(11px,1.2vw,24px)] font-medium lowercase leading-[1.1] tracking-[-0.05em] text-[#ff6a5c] [text-shadow:0_2px_16px_rgba(10,3,3,0.45)] max-sm:text-center max-sm:text-[13px]"
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