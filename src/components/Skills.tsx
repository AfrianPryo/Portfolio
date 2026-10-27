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
      const pegasus = section.querySelector<HTMLElement>(".skills-pegasus");
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

  // ===== Line drawing (lining) =====
  // Terpisah dari effect di atas dan TANPA dependencies supaya animasi tidak
  // ter-revert saat layout dihitung ulang. Gambar lebih lebar dari layar, jadi
  // target reveal dihitung dari porsi gambar yang benar-benar terlihat; garis
  // sampai ke tepi layar tepat di akhir animasi.
  // Urutan: garis tengah "ditarik" dulu dari tengah ke kiri & kanan, lalu
  // belah ketupat dan kotak terbuka ke atas-bawah dari garis itu.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const lining = section?.querySelector<HTMLImageElement>(".skills-lining");

      if (!section || !lining) return;

      const SHOWN = "inset(0% 0% 0% 0%)";
      const DRAW_DELAY = 0.12; // jeda sebelum mulai menggambar (detik)
      const AXIS_DURATION = 1.7; // garis tengah menjalar ke tepi layar
      const UNFOLD_DELAY = 0.35; // bentuk mulai terbuka setelah garis jalan sebentar
      const UNFOLD_DURATION = 1.6;
      // Menghilang: langsung bergerak begitu terpicu (easing tanpa awal lambat).
      const HIDE_UNFOLD_DURATION = 1.3;
      const HIDE_AXIS_DELAY = 0.2;
      const HIDE_AXIS_DURATION = 1.4;
      // Posisi garis tengah pada gambar (% tinggi) dan setengah tebal pita
      // yang terlihat di awal (hanya garis tengahnya).
      const AXIS_Y = 49.27;
      const AXIS_BAND = 0.5;

      // Inset kiri/kanan (persen) saat garis tepat menyentuh tepi layar.
      const getEdgeInset = () => {
        const visible = Math.min(1, section.clientWidth / lining.offsetWidth);

        return Math.max(0, ((1 - visible) / 2) * 100 - 0.5);
      };

      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        // Progres h (lebar) dan v (tinggi) 0..1 dianimasikan lewat objek proxy,
        // lalu clip-path dihitung simetris (kiri = kanan, atas/bawah mengikuti
        // posisi garis tengah) di tiap frame. Dengan begitu tidak ada
        // interpolasi string clip-path yang bisa membuat satu sisi langsung
        // muncul.
        const state = { h: 0, v: 0 };
        let draw: gsap.core.Timeline | undefined;

        const applyClip = () => {
          const x = 50 - state.h * (50 - getEdgeInset());
          const top = (1 - state.v) * (AXIS_Y - AXIS_BAND);
          const bottom = (1 - state.v) * (100 - AXIS_Y - AXIS_BAND);

          lining.style.clipPath = `inset(${top}% ${x}% ${bottom}% ${x}%)`;
        };

        gsap.set(lining, { autoAlpha: 1 });
        applyClip();

        let shown = false;

        const toggleLining = (show: boolean) => {
          if (shown === show) return;

          shown = show;
          draw?.kill();

          // Menghilang: kebalikan urutan muncul (bentuk menutup ke garis tengah,
          // lalu garis ditarik kembali ke tengah), tanpa delay dan tanpa awal
          // lambat. Berangkat dari progres saat ini, jadi aman bila dipicu di
          // tengah animasi menggambar.
          if (!show) {
            draw = gsap.timeline({ onUpdate: applyClip, onComplete: applyClip });
            draw
              .to(
                state,
                { v: 0, duration: HIDE_UNFOLD_DURATION, ease: "power2.out" },
                0,
              )
              .to(
                state,
                { h: 0, duration: HIDE_AXIS_DURATION, ease: "power2.in" },
                HIDE_AXIS_DELAY,
              );
            return;
          }

          draw = gsap.timeline({
            delay: DRAW_DELAY,
            onUpdate: applyClip,
            onComplete: () => {
              // Setelah selesai, lepas clip sepenuhnya (aman saat resize).
              lining.style.clipPath = SHOWN;
            },
          });
          draw
            .to(
              state,
              { h: 1, duration: AXIS_DURATION, ease: "power3.out" },
              0,
            )
            .to(
              state,
              { v: 1, duration: UNFOLD_DURATION, ease: "power2.inOut" },
              UNFOLD_DELAY,
            );
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
          onLeave: () => toggleLining(false),
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

        return () => draw?.kill();
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(lining, { autoAlpha: 1, clipPath: SHOWN });
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
        {/* Lining latar (gambar webp di /public/lining-skill.webp). Wrapper
            dibuat lebih lebar dari stage (191%; 230vw di mobile) supaya kotak
            tengah ±50% lebar layar dan ujung diamond terpotong di tepi. Di layar
            sangat lebar (mis. 21:9) lebarnya dibatasi 340svh supaya kotak tengah
            tidak lebih tinggi dari stage; di 16:9 hasilnya sama seperti sebelumnya. Garis
            tengah (49,27% tinggi gambar) tetap disejajarkan dengan tengah stage
            lewat translate-y persentase, jadi tetap sejajar dengan title berapa
            pun lebarnya. Di-reveal lewat clip-path oleh GSAP (class skills-lining). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[min(191%,340svh)] -translate-x-1/2 -translate-y-[49.27%] max-sm:w-[230vw]"
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
            filter lensa barrel (hanya foto yang melewatinya, teks/pegasus/lining
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
                <div className="absolute inset-0 z-10 bg-[#d3141f] mix-blend-multiply" />
                <div className="absolute inset-0 z-10 bg-[#ff6b6b]/25 mix-blend-screen" />
              </div>
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
              className="skills-title col-start-1 row-start-1 font-acerok text-[clamp(24px,3.2vw,62px)] font-normal uppercase leading-[0.92] tracking-[-0.07em] text-flame max-sm:text-center max-sm:text-[clamp(26px,8vw,40px)]"
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
              className="skills-desc col-start-1 row-start-1 text-left font-switzer text-[clamp(11px,1.2vw,24px)] font-medium lowercase leading-[1.1] tracking-[-0.05em] text-flame max-sm:text-center max-sm:text-[13px]"
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