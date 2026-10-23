"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PROJECTS, type Project, type ProjectCategory } from "@/lib/projects";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Urutan kategori: proyek sekategori selalu berdekatan.
const CATEGORY_ORDER: ProjectCategory[] = ["website", "design", "art"];

const SORTED_PROJECTS: Project[] = [...PROJECTS].sort(
  (a, b) =>
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
);

const TOTAL = SORTED_PROJECTS.length;

// Pilihan rasio gambar (lebar : tinggi) dan batas jumlah gambar per proyek.
const RATIO_POOL = [2 / 3, 3 / 4, 4 / 5, 1, 5 / 4, 4 / 3, 3 / 2, 16 / 9, 2 / 1];
const MIN_IMAGES = 2;
const MAX_IMAGES = 5;
const GAP = 10; // px, harus sama dengan gap pada baris gambar
// Total rasio maksimum satu baris. Dengan tinggi baris yang sama di semua
// proyek, batas ini menjaga baris tetap muat di lebar layar.
const MAX_RATIO_SUM = 3;

const PALETTE = [
  ["#1d1d1b", "#ff4d1c"],
  ["#0b1a3a", "#2f6bff"],
  ["#2a1a12", "#ffb347"],
  ["#10201c", "#3ddc97"],
  ["#241233", "#c77dff"],
  ["#2b0f14", "#ff5d73"],
];

// Peran cadangan per kategori, dipakai kalau proyek belum punya data.
const FALLBACK_ROLE: Record<ProjectCategory, string> = {
  website: "Design & Development",
  design: "Visual Design",
  art: "Illustration",
};

// Kontribusi cadangan per kategori, dipakai kalau proyek belum punya data.
const FALLBACK_CONTRIBUTIONS: Record<ProjectCategory, string[]> = {
  website: [
    "Merancang UI/UX dan struktur halaman",
    "Mengembangkan front-end yang responsif",
    "Membuat animasi dan interaksi",
    "Mengoptimalkan performa dan aksesibilitas",
  ],
  design: [
    "Riset visual dan penyusunan moodboard",
    "Mengembangkan konsep desain",
    "Eksekusi visual dan finalisasi aset",
  ],
  art: [
    "Mengembangkan konsep dan sketsa",
    "Membuat ilustrasi utama",
    "Pewarnaan dan finishing",
  ],
};

// Pengacak berbenih: hasil acak selalu sama di server dan client, jadi tidak
// ada hydration mismatch, tetapi tiap proyek tetap berbeda.
function mulberry32(seed: number) {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Gambar dummy berupa SVG gradien (data URI), diganti gambar asli nanti.
function dummyImage(seed: number, ratio: number) {
  const w = 800;
  const h = Math.round(w / ratio);
  const [a, b] = PALETTE[seed % PALETTE.length];
  const cx = 20 + ((seed * 37) % 60);
  const cy = 20 + ((seed * 53) % 60);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><radialGradient id="g" cx="${cx}%" cy="${cy}%" r="75%"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

type DummyImage = { ratio: number; src: string };

// Tiap proyek mendapat jumlah dan rasio gambar sendiri; susunannya dijamin
// tidak sama dengan proyek sebelumnya.
const SLIDE_IMAGES: DummyImage[][] = (() => {
  const result: DummyImage[][] = [];
  let previous = "";

  SORTED_PROJECTS.forEach((project, index) => {
    // Proyek dengan gambar asli: pakai langsung, tanpa gambar dummy.
    if (project.slides && project.slides.length) {
      result.push(project.slides);
      previous = "";
      return;
    }

    let signature = "";
    let ratios: number[] = [];
    let attempt = 0;

    do {
      const rand = mulberry32((index + 1) * 7919 + attempt * 104729);
      const count =
        MIN_IMAGES + Math.floor(rand() * (MAX_IMAGES - MIN_IMAGES + 1));

      ratios = Array.from(
        { length: count },
        () => RATIO_POOL[Math.floor(rand() * RATIO_POOL.length)]
      );
      // Buang gambar terakhir sampai total lebar muat (minimal tetap 2).
      while (
        ratios.length > MIN_IMAGES &&
        ratios.reduce((s, r) => s + r, 0) > MAX_RATIO_SUM
      ) {
        ratios.pop();
      }
      signature = ratios.map((r) => r.toFixed(2)).join("|");
      attempt += 1;
    } while (signature === previous && attempt < 20);

    previous = signature;
    result.push(
      ratios.map((ratio, i) => ({
        ratio,
        src: dummyImage(index * 5 + i, ratio),
      }))
    );
  });

  return result;
})();

// Foto tambahan untuk galeri di sidebar (di luar foto pada baris section).
// Pola rasio diputar per proyek supaya tiap galeri terasa berbeda.
const GALLERY_RATIOS = [16 / 9, 4 / 5, 1, 3 / 2, 4 / 5, 16 / 9];

const GALLERY_IMAGES: DummyImage[][] = SORTED_PROJECTS.map((project, index) =>
  project.gallery && project.gallery.length
    ? project.gallery
    : GALLERY_RATIOS.map((_, i) => {
    const ratio = GALLERY_RATIOS[(i + index) % GALLERY_RATIOS.length];

    return { ratio, src: dummyImage(100 + index * 7 + i, ratio) };
      })
);

const pad = (n: number) => String(n).padStart(2, "0");

// Pudar di tepi atas/bawah supaya baris yang keluar masuk terasa halus.
const FADE_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%)";

const FOCUSABLE = "a[href], button:not([disabled])";
const subscribeToMount = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

// Plus.svg berwarna putih, dipakai sebagai mask supaya warnanya mengikuti
// utilitas bg-* pada pemakainya.
const PLUS_MASK = "url(/icon-custom/Plus.svg)";

function Plus({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        WebkitMaskImage: PLUS_MASK,
        maskImage: PLUS_MASK,
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

export default function Works() {
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelReadyRef = useRef(false);

  const [active, setActive] = useState(0);
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getMountedSnapshot,
    getServerMountedSnapshot
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    project: number;
    image: number;
  } | null>(null);

  const selectedProject = selected ? SORTED_PROJECTS[selected.project] : null;
  const selectedImage = selected
    ? SLIDE_IMAGES[selected.project][selected.image]
    : null;

  // Data tambahan proyek yang dipilih (dengan nilai cadangan).
  const extra: Partial<Project> = selectedProject ?? {};
  // Kontribusi saya di proyek ini (dengan nilai cadangan per kategori).
  const contributions =
    extra.contributions && extra.contributions.length
      ? extra.contributions
      : selectedProject
        ? FALLBACK_CONTRIBUTIONS[selectedProject.category] ?? []
        : [];
  const meta = [
    { label: "Tahun", value: extra.year },
    {
      label: "Peran",
      value:
        extra.role ??
        (selectedProject ? FALLBACK_ROLE[selectedProject.category] : undefined),
    },
    { label: "Klien", value: extra.client },
    { label: "Durasi", value: extra.duration },
  ].filter((item) => item.value !== undefined && item.value !== "");
  const overviewParagraphs = (extra.overview ?? "")
    .split(/\n\s*\n/)
    .map((text) => text.trim())
    .filter(Boolean);
  // Galeri: foto asli kalau ada, kalau tidak pakai foto dummy.
  const galleryImages: DummyImage[] = selected
    ? extra.images && extra.images.length
      ? extra.images.map((src) => ({ ratio: 4 / 3, src }))
      : GALLERY_IMAGES[selected.project]
    : [];

  // Satu proyek = satu kesatuan: foto mana pun yang diklik, sidebar selalu
  // terbuka dengan isi yang sama (mulai dari foto pertama).
  const openProject = (project: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelected({ project, image: 0 });
    setOpen(true);
  };

  const closeProject = () => setOpen(false);

  // Ganti foto utama di sidebar tanpa menutupnya.
  const selectImage = (image: number) =>
    setSelected((current) => (current ? { ...current, image } : current));

  // Saat sidebar terbuka: kunci scroll, matikan interaksi section, Esc untuk
  // menutup, Tab dijaga tetap di dalam sidebar. Fokus dikembalikan ke foto
  // yang diklik saat ditutup.
  useEffect(() => {
    if (!open) return;

    const root = rootRef.current;
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.setProperty("overflow", "hidden");
    // Cegah halaman bergeser saat scrollbar hilang.
    if (scrollbar > 0) {
      document.body.style.setProperty("padding-right", `${scrollbar}px`);
    }
    root?.setAttribute("inert", "");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));

      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.setProperty("overflow", previousOverflow);
      document.body.style.setProperty("padding-right", previousPadding);
      root?.removeAttribute("inert");
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  // Sidebar selalu mulai dari atas setiap kali proyek dibuka.
  useEffect(() => {
    if (open) panelRef.current?.scrollTo({ top: 0 });
  }, [open, selected?.project]);

  // Animasi sidebar: masuk dari kiri, isinya menyusul berurutan.
  useGSAP(
    () => {
      const panel = panelRef.current;
      const scrim = scrimRef.current;

      if (!mounted || !panel || !scrim) return;

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const animate = panelReadyRef.current && !reduce;
      const items = gsap.utils.toArray<HTMLElement>("[data-panel-item]", panel);

      panelReadyRef.current = true;

      if (open) {
        gsap.to(scrim, {
          autoAlpha: 1,
          duration: animate ? 0.4 : 0,
          overwrite: "auto",
        });
        gsap.to(panel, {
          xPercent: 0,
          autoAlpha: 1,
          duration: animate ? 0.7 : 0,
          ease: "power3.out",
          overwrite: "auto",
          onStart: () => closeRef.current?.focus({ preventScroll: true }),
        });

        if (animate) {
          gsap.fromTo(
            items,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.07,
              delay: 0.25,
              ease: "power3.out",
              overwrite: "auto",
            }
          );
        } else {
          gsap.set(items, { autoAlpha: 1, y: 0 });
        }
      } else {
        gsap.to(scrim, {
          autoAlpha: 0,
          duration: animate ? 0.35 : 0,
          overwrite: "auto",
        });
        gsap.to(panel, {
          xPercent: -100,
          autoAlpha: 0,
          duration: animate ? 0.5 : 0,
          ease: "power3.in",
          overwrite: "auto",
        });
      }
    },
    { dependencies: [open, mounted] }
  );

  // Section di-pin setinggi layar. Selama user scroll, hanya daftar proyek
  // (nama + foto) yang bergerak naik; baris yang melewati tengah menjadi aktif.
  useGSAP(
    () => {
      const root = rootRef.current;
      const list = listRef.current;

      if (!root || !list || TOTAL < 1) return;

      const rows = gsap.utils.toArray<HTMLElement>("[data-slide]", list);
      const first = rows[0];
      const last = rows[rows.length - 1];

      if (!first || !last) return;

      // Posisi list saat baris pertama / terakhir tepat di tengah layar.
      const startY = () =>
        root.clientHeight / 2 - (first.offsetTop + first.offsetHeight / 2);
      const endY = () =>
        root.clientHeight / 2 - (last.offsetTop + last.offsetHeight / 2);

      gsap.fromTo(
        list,
        { y: startY },
        {
          y: endY,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${Math.max(1, Math.round(startY() - endY()))}`,
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            // Dihitung lebih dulu dari trigger section lain (mis. Contact)
            // supaya jarak pin sudah masuk saat posisi mereka dihitung.
            refreshPriority: 1,
            onUpdate: (self) => {
              setActive(
                Math.round(self.progress * Math.max(0, TOTAL - 1))
              );
            },
          },
        }
      );

      // Gambar dan font bisa menggeser layout; hitung ulang posisi trigger.
      const refresh = () => ScrollTrigger.refresh();

      window.addEventListener("load", refresh);
      document.fonts?.ready.then(refresh);

      return () => window.removeEventListener("load", refresh);
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      id="works"
      aria-label="Karya"
      className="relative isolate h-svh w-full overflow-hidden bg-black"
    >
      {/* Jendela tetap setinggi layar. Semua yang bergerak (daftar proyek)
          dipotong keras di sini lewat overflow, clip-path, dan contain, jadi
          tidak bisa keluar ke section lain. */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: "inset(0)",
          contain: "paint",
          WebkitMaskImage: FADE_MASK,
          maskImage: FADE_MASK,
        }}
      >
        <div ref={listRef} className="will-change-transform">
          {SORTED_PROJECTS.map((project, index) => {
            const isActive = index === active;
            const images = SLIDE_IMAGES[index];
            const ratioSum = images.reduce(
              (sum, image) => sum + image.ratio,
              0
            );
            const gaps = (images.length - 1) * GAP;

            return (
              <article
                key={project.slug}
                data-slide
                className="group/project relative flex w-full items-center px-[4vw] py-[clamp(6px,0.8vw,12px)] max-lg:py-5"
              >
                <div className="mx-auto flex w-full max-w-[1500px] items-start gap-[clamp(48px,5vw,80px)] max-lg:flex-col max-lg:items-start max-lg:gap-3">
                  {/* Kiri: title proyek kecil.
                      Mobile/tablet: satu baris header → [nomor] JUDUL ... kategori */}
                  <div
                    className={`flex shrink-0 flex-col gap-2 transition-opacity duration-500 max-lg:w-full max-lg:flex-row max-lg:items-baseline max-lg:gap-3 lg:w-[clamp(120px,14vw,220px)] group-hover/project:opacity-100 group-focus-within/project:opacity-100 ${
                      isActive ? "opacity-100" : "opacity-30"
                    }`}
                  >
                    {/* Nomor versi mobile (versi desktop ada di sisi foto) */}
                    <span className="font-switzer text-[12px] leading-none text-white lg:hidden">
                      [{pad(index + 1)}]
                    </span>
                    <h2 className="font-acerok text-[clamp(13px,1.1vw,18px)] font-normal uppercase leading-[1.1] text-white max-lg:min-w-0 max-lg:text-[15px]">
                      {project.title}
                    </h2>
                    <span className="font-switzer text-[clamp(11px,0.9vw,14px)] capitalize leading-none tracking-[-0.01em] text-white max-lg:ml-auto max-lg:text-[12px]">
                      {project.category}
                    </span>
                  </div>

                  {/* Kanan: gambar rata kanan. Semua proyek memakai tinggi
                      baris yang sama; lebar tiap gambar mengikuti rasionya.
                      Mobile/tablet: baris penuh selebar layar dengan tinggi
                      seragam (gambar di-crop), maksimal 3 foto di < 640px. */}
                  <div className="flex min-w-0 flex-1 justify-end max-lg:w-full">
                    <div
                      className="relative flex w-[var(--row-w)] max-w-full flex-col gap-2 [--row-h:clamp(110px,min(34svh,22vw),380px)] max-lg:w-full lg:gap-0"
                      style={
                        {
                          "--row-w": `calc(var(--row-h) * ${ratioSum.toFixed(3)} + ${gaps}px)`,
                        } as CSSProperties
                      }
                    >
                      {/* Nomor di sisi kiri foto pertama, sejajar tepi atasnya.
                          Disembunyikan di mobile (pindah ke header). */}
                      <span
                        className={`font-switzer text-[clamp(11px,0.9vw,14px)] leading-none text-white transition-opacity duration-500 max-lg:hidden lg:absolute lg:right-full lg:top-0 lg:mr-3 group-hover/project:opacity-100 group-focus-within/project:opacity-100 ${
                          isActive ? "opacity-100" : "opacity-30"
                        }`}
                      >
                        [{pad(index + 1)}]
                      </span>

                      <div className="flex items-end" style={{ gap: GAP }}>
                        {images.map(({ ratio, src }, i) => (
                          <button
                            key={i}
                            type="button"
                            aria-haspopup="dialog"
                            aria-label={`Buka detail ${project.title}`}
                            onClick={(event) =>
                              openProject(index, event.currentTarget)
                            }
                            style={
                              {
                                "--ar": String(ratio),
                                flex: `${ratio} 1 0%`,
                              } as CSSProperties
                            }
                            className={`block min-w-0 cursor-pointer overflow-hidden rounded-[2px] bg-flame/10 transition-opacity duration-300 ease-out [aspect-ratio:var(--ar)] max-lg:h-[clamp(120px,24svh,220px)] max-lg:[aspect-ratio:auto] max-sm:[&:nth-child(n+4)]:hidden group-hover/project:opacity-100 group-focus-within/project:opacity-100 focus-visible:outline-none ${
                              isActive ? "opacity-70" : "opacity-30"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              className="h-full w-full select-none object-cover object-top"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Penanda posisi, diam di tempat */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[2vw] top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-2 max-sm:hidden"
      >
        {SORTED_PROJECTS.map((project, i) => (
          <span
            key={project.slug}
            className={`block w-px bg-flame transition-all duration-500 ${
              i === active ? "h-8 opacity-100" : "h-3 opacity-30"
            }`}
          />
        ))}
      </div>

      {/* Sidebar detail proyek (detail final, tanpa halaman lanjutan),
          dirender di body supaya berada di atas navbar dan tidak ikut
          terpotong/ter-pin oleh section */}
      {mounted &&
        createPortal(
          <>
            <div
              ref={scrimRef}
              aria-hidden="true"
              onClick={closeProject}
              className="invisible fixed inset-0 z-[190] bg-black/60 opacity-0"
            />
            <aside
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="works-panel-title"
              // Cegah smooth-scroll global (mis. Lenis) menelan scroll di sini.
              data-lenis-prevent
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
              style={{
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.25) transparent",
                // Efek blur pada background sidebar.
                backdropFilter: "blur(24px) saturate(1.2)",
                WebkitBackdropFilter: "blur(24px) saturate(1.2)",
              }}
              // shrink-0 pada semua anak: tanpa ini isi menyusut mengikuti
              // tinggi layar dan panel tidak pernah bisa di-scroll.
              className="invisible fixed left-0 top-0 z-[200] flex h-svh w-[min(520px,92vw)] flex-col gap-[clamp(18px,1.8vw,28px)] overflow-y-auto overflow-x-hidden border-r border-flame/20 bg-black/50 p-[clamp(20px,2vw,32px)] pb-[clamp(40px,4vw,64px)] opacity-0 [&>*]:shrink-0"
            >
              <div
                data-panel-item
                className="flex items-center justify-between"
              >
                <span className="font-switzer text-[clamp(12px,1.1vw,17px)] capitalize leading-none tracking-[-0.01em] text-white">
                  {selectedProject?.category}
                </span>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Tutup detail proyek"
                  onClick={closeProject}
                  className="group -mr-2 flex h-10 w-10 items-center justify-center focus-visible:outline-none"
                >
                  <Plus className="h-5 w-5 rotate-45 bg-flame/70 transition-all duration-500 ease-out group-hover:rotate-[135deg] group-hover:bg-flame group-focus-visible:rotate-[135deg] group-focus-visible:bg-flame" />
                </button>
              </div>

              {selectedProject && selectedImage && selected && (
                <>
                  {/* Foto utama + deretan thumbnail untuk berpindah foto */}
                  <div data-panel-item className="flex flex-col gap-2">
                    <div className="aspect-[16/10] w-full overflow-hidden bg-flame/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={`${selectedProject.slug}-${selected.image}`}
                        src={selectedImage.src}
                        alt={`${selectedProject.title} project preview`}
                        decoding="async"
                        draggable={false}
                        className="h-full w-full select-none object-cover object-top"
                      />
                    </div>

                    {SLIDE_IMAGES[selected.project].length > 1 && (
                      <div className="flex gap-2">
                        {SLIDE_IMAGES[selected.project].map((image, i) => (
                          <button
                            key={i}
                            type="button"
                            aria-label={`Tampilkan foto ${i + 1} dari ${selectedProject.title}`}
                            aria-pressed={i === selected.image}
                            onClick={() => selectImage(i)}
                            className={`aspect-[4/3] min-w-0 flex-1 cursor-pointer overflow-hidden bg-flame/10 outline-offset-2 transition-opacity duration-300 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-flame ${
                              i === selected.image
                                ? "opacity-100 outline outline-1 outline-flame"
                                : "opacity-40"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.src}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              className="h-full w-full select-none object-cover object-top"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <h2
                    id="works-panel-title"
                    data-panel-item
                    className="font-acerok text-[clamp(28px,3vw,44px)] font-normal uppercase leading-[1.05] tracking-normal text-white"
                  >
                    {selectedProject.title}
                  </h2>

                  <p
                    data-panel-item
                    className="font-switzer text-[clamp(15px,1.2vw,18px)] leading-[1.3] tracking-[-0.01em] text-white"
                  >
                    {selectedProject.description}
                  </p>

                  {/* Ringkasan panjang proyek (tampil kalau ada) */}
                  {overviewParagraphs.length > 0 && (
                    <section
                      data-panel-item
                      aria-labelledby="works-panel-overview"
                      className="flex flex-col gap-3 border-t border-flame/20 pt-4"
                    >
                      <h3
                        id="works-panel-overview"
                        className="font-acerok text-[clamp(12px,1vw,14px)] font-normal uppercase leading-none text-white"
                      >
                        Tentang proyek
                      </h3>
                      {overviewParagraphs.map((text, i) => (
                        <p
                          key={i}
                          className="font-switzer text-[clamp(14px,1.1vw,16px)] leading-[1.4] tracking-[-0.01em] text-white"
                        >
                          {text}
                        </p>
                      ))}
                    </section>
                  )}

                  {/* Info singkat: kategori, tahun, peran, klien, durasi */}
                  {meta.length > 0 && (
                    <dl
                      data-panel-item
                      className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-flame/20 pt-4 font-switzer text-[clamp(13px,1vw,15px)] leading-[1.3]"
                    >
                      {meta.map((item) => (
                        <div key={item.label} className="contents">
                          <dt className="text-white">{item.label}</dt>
                          <dd className="text-white">{String(item.value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {/* Kontribusi: apa yang dikerjakan di proyek ini */}
                  {contributions.length > 0 && (
                    <section
                      data-panel-item
                      aria-labelledby="works-panel-contribution"
                      className="flex flex-col gap-3 border-t border-flame/20 pt-4"
                    >
                      <h3
                        id="works-panel-contribution"
                        className="font-acerok text-[clamp(12px,1vw,14px)] font-normal uppercase leading-none text-white"
                      >
                        Kontribusi
                      </h3>
                      <ul className="flex flex-col gap-2.5 font-switzer text-[clamp(14px,1.1vw,16px)] leading-[1.35] text-white">
                        {contributions.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <Plus className="mt-[0.3em] h-3 w-3 shrink-0 bg-flame/70" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Galeri foto proyek */}
                  {galleryImages.length > 0 && (
                    <section
                      data-panel-item
                      aria-labelledby="works-panel-gallery"
                      className="flex flex-col gap-3 border-t border-flame/20 pt-4"
                    >
                      <h3
                        id="works-panel-gallery"
                        className="font-acerok text-[clamp(12px,1vw,14px)] font-normal uppercase leading-none text-white"
                      >
                        Galeri
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {galleryImages.map(({ ratio, src }, i) => (
                          <div
                            key={`${selectedProject.slug}-g${i}`}
                            style={{ aspectRatio: String(ratio) }}
                            className={`overflow-hidden bg-flame/10 ${
                              ratio > 1.5 ? "col-span-2" : ""
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`${selectedProject.title} foto ${i + 1}`}
                              loading="lazy"
                              decoding="async"
                              draggable={false}
                              className="h-full w-full select-none object-cover object-top"
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Tautan proyek live (hanya kalau ada) */}
                  {extra.url && (
                    <a
                      data-panel-item
                      href={extra.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 border border-flame/40 px-5 py-4 font-acerok text-[clamp(13px,1.1vw,16px)] uppercase leading-none text-white transition-colors duration-300 hover:bg-flame hover:text-black focus-visible:bg-flame focus-visible:text-black focus-visible:outline-none"
                    >
                      <span>Kunjungi proyek</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </>
              )}
            </aside>
          </>,
          document.body
        )}
    </section>
  );
}