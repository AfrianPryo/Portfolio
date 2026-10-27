"use client";

import {
  useCallback,
  useEffect,
  useMemo,
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

// Di mobile, bar alamat yang muncul/hilang mengubah window.innerHeight dan
// memicu refresh di tengah scroll. Abaikan resize kecil itu.
ScrollTrigger.config({ ignoreMobileResize: true });

// Tinggi 1svh x 100 dalam px. Seluruh jarak scroll di CSS memakai svh, jadi
// hitungan di JS juga harus memakai satuan yang sama (bukan window.innerHeight
// yang berubah-ubah di mobile).
function svhPx() {
  const probe = document.createElement("div");

  probe.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);

  const height = probe.offsetHeight;

  probe.remove();

  return height || window.innerHeight;
}

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
// Total rasio maksimum untuk gambar dummy per proyek.
const MAX_RATIO_SUM = 3;

// ---- Slider horizontal: kartu berjajar lurus dengan jarak (gap) biasa.
// Scroll menggeser deretan ke samping; saat bergerak, lensa barrel (fish eye)
// menguat sesuai kecepatan geser, lalu mengendur lagi saat berhenti.
const CARD_GAP = "clamp(16px,2.2vw,40px)";
// Jarak scroll per proyek, relatif terhadap tinggi layar.
const SCROLL_PER_PROJECT = 0.6;
// Gelap maksimum kartu yang jauh dari tengah (0 = tidak digelapkan).
const MAX_SHADE = 0.55;
// Kekuatan barrel (SVG feDisplacementMap): maks yang dikodekan di peta,
// puncak saat scroll cepat, dan pengali dari kecepatan (kartu/detik).
const BARREL_MAX = 0.4;
const BARREL_PEAK = 0.3;
const BARREL_GAIN = 0.16;
// Kecepatan respons lensa (makin besar makin cepat mengikuti/mengendur).
const BARREL_RESPONSE = 7;

// ---- Transisi masuk & keluar section ----
// Masuk: section ini menempel tepat di atas layar merah penuh dari akhir
// Skills (warnanya sama), lalu elemen-elemennya muncul di latar itu. Keluar:
// setelah kartu terakhir ada scroll tambahan (EXIT_SCREENS layar). Isi memudar
// ke atas, lalu tangga hitam tumbuh dari kanan atas menutup layar.
// Latar section: bg-[#e00000] (harus sama dengan COVER_COLOR di Skills).
// Scroll tambahan (layar) untuk animasi masuk (elemen muncul mengikuti scroll)
// dan animasi keluar.
const ENTRY_SCREENS = 0.7;
// Panjang scroll (layar) fase tangga merah di akhir Skills. Harus sama dengan
// COVER_SCREENS - COVER_LEAD di Skills.
const STAIR_IN_SCREENS = 1.7;
const BG_COLOR = "#e00000";
// Total scroll fase keluar. Bagian akhirnya (CONTACT_OVERLAP) dipakai Contact
// untuk naik menimpa; animasi tangga hitam memakai sisanya
// (EXIT_SCREENS - CONTACT_OVERLAP + ANIM_OVERLAP, minimal sekitar 0.5).
const EXIT_SCREENS = 1.7;
// Harus sama dengan margin negatif di Contact (-mt-[140svh] = 1.4).
const CONTACT_OVERLAP = 1.4;
// Animasi tangga hitam dibiarkan berjalan sebentar (layar) bersamaan dengan
// Contact yang mulai naik, supaya tidak ada jeda layar kosong di antaranya.
const ANIM_OVERLAP = 0.3;
const EXIT_COLOR = "#000";
const STAIR_COLS = 12;
const STAIR_ROWS = 8;
const STAIR_SKEW = 1.6;
const STAIR_JITTER = [0, 0.5, 0.15, 0.7, 0.3, 0.6, 0.1, 0.45]; // >= 0
const STAIR_JITTER_MAX = Math.max(...STAIR_JITTER);

// "sine.inOut" = awal & akhir lebih landai dari power2.inOut.
// Alternatif: "power1.inOut" (lebih netral) atau "power3.inOut" (lebih dramatis).
const STAIR_EASE = "sine.inOut";

let stairEase: ((t: number) => number) | undefined;

// Polygon clip-path tangga untuk progres p (0..1). `mirror` = tumbuh dari
// kanan atas (bukan kiri atas). Lebar tiap baris kontinu supaya halus.
// Di p = 1 seluruh layar terisi.
function stairClip(p: number, mirror = false) {
  stairEase ??= gsap.parseEase(STAIR_EASE);

  const total = STAIR_COLS + (STAIR_ROWS - 1) * STAIR_SKEW + STAIR_JITTER_MAX;
  const front = stairEase(p) * total;
  const pts: string[] = [mirror ? "100% 0%" : "0% 0%"];

  for (let r = 0; r < STAIR_ROWS; r += 1) {
    const cols = Math.max(
      0,
      Math.min(STAIR_COLS, front - r * STAIR_SKEW - (STAIR_JITTER[r] ?? 0))
    );
    const filled = (cols / STAIR_COLS) * 100;
    const x = (mirror ? 100 - filled : filled).toFixed(2);
    const top = ((r / STAIR_ROWS) * 100).toFixed(2);
    const bottom = (((r + 1) / STAIR_ROWS) * 100).toFixed(2);

    pts.push(`${x}% ${top}%`, `${x}% ${bottom}%`);
  }
  pts.push(mirror ? "100% 100%" : "0% 100%");

  return `polygon(${pts.join(",")})`;
}

// Peta displacement radial untuk lensa barrel seukuran stage. Piksel keluaran
// mengambil sampel dari titik yang lebih jauh dari pusat, sehingga isi menyusut
// ke tepi dan bentuknya melengkung seperti tong. `aspect` = tinggi / lebar.
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
      const r2 = Math.sqrt(u * u + v * v);
      const o = (j * w + i) * 4;

      data.data[o] = Math.round((0.5 + (BARREL_MAX * r2 * u) / 2) * 255);
      data.data[o + 1] = Math.round(
        (0.5 + (BARREL_MAX * r2 * v * aspect) / 2) * 255
      );
      data.data[o + 2] = 128;
      data.data[o + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL();
}

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
  const w = 640;
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

// Foto tambahan untuk galeri di sidebar (di luar foto pada kartu slider).
// Pola rasio diputar per proyek supaya tiap galeri terasa berbeda.
// Dibuat malas (saat proyek dibuka) dan di-cache.
const GALLERY_RATIOS = [16 / 9, 4 / 5, 1, 3 / 2, 4 / 5, 16 / 9];

const galleryCache = new Map<number, DummyImage[]>();

function getGalleryImages(index: number): DummyImage[] {
  const cached = galleryCache.get(index);

  if (cached) return cached;

  const project = SORTED_PROJECTS[index];
  const images: DummyImage[] =
    project.gallery && project.gallery.length
      ? project.gallery
      : GALLERY_RATIOS.map((_, i) => {
          const ratio = GALLERY_RATIOS[(i + index) % GALLERY_RATIOS.length];

          return { ratio, src: dummyImage(100 + index * 7 + i, ratio) };
        });

  galleryCache.set(index, images);

  return images;
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelReadyRef = useRef(false);
  const activeRef = useRef(0);
  const titleRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  // Porsi awal rentang scroll (0..1) yang dipakai menggeser kartu; sisanya
  // dipakai animasi keluar.
  const cardsRangeRef = useRef({ from: 0, span: 1 });

  const [active, setActive] = useState(0);
  // true setelah section menempel (tangga merah dari Skills sudah penuh):
  // memicu judul besar muncul.
  const [shown, setShown] = useState(false);
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

  const selectedIndex = selected?.project ?? null;
  const selectedProject =
    selectedIndex !== null ? SORTED_PROJECTS[selectedIndex] : null;
  const selectedImage = selected
    ? SLIDE_IMAGES[selected.project][selected.image]
    : null;

  // Proyek yang sedang berada di tengah slider (untuk label di layar).
  const activeProject = SORTED_PROJECTS[active] ?? SORTED_PROJECTS[0];

  // Judul besar dipecah per kata lalu per huruf untuk animasi masuk.
  const titleWords = (activeProject?.title ?? "").split(/\s+/).filter(Boolean);

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
  // Di-memo per proyek supaya tidak dibuat ulang di setiap render sidebar.
  const galleryImages: DummyImage[] = useMemo(() => {
    if (selectedIndex === null) return [];

    const project = SORTED_PROJECTS[selectedIndex];

    return project.images && project.images.length
      ? project.images.map((src) => ({ ratio: 4 / 3, src }))
      : getGalleryImages(selectedIndex);
  }, [selectedIndex]);

  // Satu proyek = satu kesatuan: kartu mana pun yang diklik, sidebar selalu
  // terbuka dengan isi yang sama (mulai dari foto pertama).
  const openProject = useCallback((project: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setSelected({ project, image: 0 });
    setOpen(true);
  }, []);

  const closeProject = () => setOpen(false);

  // Klik kartu samping: scroll ke posisi kartu itu (snap menyesuaikan).
  const goTo = (index: number) => {
    const st = stRef.current;

    if (!st || TOTAL < 2) return;

    window.scrollTo({
      top:
        st.start +
        (st.end - st.start) *
          (cardsRangeRef.current.from +
            cardsRangeRef.current.span * (index / (TOTAL - 1))),
      behavior: "smooth",
    });
  };

  // Ganti foto utama di sidebar tanpa menutupnya.
  const selectImage = (image: number) =>
    setSelected((current) => (current ? { ...current, image } : current));

  // Saat sidebar terbuka: kunci scroll, matikan interaksi section, Esc untuk
  // menutup, Tab dijaga tetap di dalam sidebar. Fokus dikembalikan ke kartu
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

  // Gambar 3 kartu pertama tidak lagi "eager" (Works jauh di bawah Hero, jadi
  // tidak boleh berebut bandwidth dengan konten awal). Sebagai gantinya dimuat
  // ke cache saat browser idle supaya sudah siap sebelum Works terlihat.
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const warm = () => {
      for (let i = 0; i < Math.min(3, SLIDE_IMAGES.length); i++) {
        const pre = new Image();
        pre.decoding = "async";
        pre.src = SLIDE_IMAGES[i][0].src;
      }
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(warm, { timeout: 4000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(warm, 2500);
    return () => window.clearTimeout(t);
  }, []);

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

  // Judul besar: huruf muncul dari tengah ke luar setiap proyek aktif berganti.
  // Hanya opacity + transform (tanpa filter blur per huruf) supaya ringan.
  useGSAP(
    () => {
      const el = titleRef.current;

      if (!el) return;

      const chars = gsap.utils.toArray<HTMLElement>("[data-char]", el);

      // Belum waktunya: judul menunggu section menempel di latar merah.
      if (!shown) {
        gsap.set(chars, { autoAlpha: 0 });
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(chars, { autoAlpha: 1 });
        return;
      }

      gsap.fromTo(
        chars,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.7,
          stagger: { each: 0.025, from: "center" },
          ease: "power1.out",
          overwrite: "auto",
        }
      );
    },
    { dependencies: [active, shown], scope: titleRef }
  );

  // Section di-pin setinggi layar. Scroll menggeser deretan kartu ke samping
  // (slider horizontal, gap biasa). Kartu terdekat dari tengah menjadi proyek
  // aktif. Lensa barrel (fish eye) hanya menguat saat deretan sedang bergerak,
  // sebanding dengan kecepatannya, lalu kembali rata saat berhenti.
  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const root = rootRef.current;
      const stage = stageRef.current;
      const track = stage?.querySelector<HTMLElement>("[data-track]");
      const layer = stage?.querySelector<HTMLElement>("[data-lens-layer]");
      const barrel = root?.querySelector<SVGFilterElement>("#works-barrel");
      const map =
        root?.querySelector<SVGFEImageElement>("#works-barrel-map");
      const disp = root?.querySelector<SVGFEDisplacementMapElement>(
        "#works-barrel-disp"
      );

      if (!wrap || !root || !stage || !track || !layer || TOTAL < 1) return;

      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", track);

      if (!cards.length) return;

      const shades = cards.map(
        (card) => card.querySelector<HTMLElement>("[data-shade]")
      );
      // Cache opacity terakhir tiap kartu: tulis ke DOM hanya kalau berubah.
      const shadeCache = cards.map(() => -1);
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      // Filter displacement di layar penuh itu mahal: lewati di perangkat
      // layar sentuh dan perangkat dengan CPU lemah.
      const lowPower =
        window.matchMedia("(pointer: coarse)").matches ||
        (navigator.hardwareConcurrency ?? 8) <= 4;
      const state = { pos: 0 };
      let step = 0; // jarak antar pusat kartu (lebar kartu + gap), px
      let lastTransform = "";

      // Geser deretan dan gelapkan kartu yang jauh dari tengah.
      const render = (pos: number) => {
        const transform = `translate3d(${(-pos * step).toFixed(1)}px,0,0)`;

        if (transform !== lastTransform) {
          lastTransform = transform;
          track.style.transform = transform;
        }

        for (let i = 0; i < cards.length; i += 1) {
          const shade = shades[i];

          if (!shade) continue;

          const value = Number(
            Math.min(MAX_SHADE, Math.abs(i - pos) * 0.45).toFixed(2)
          );

          if (value !== shadeCache[i]) {
            shadeCache[i] = value;
            shade.style.opacity = String(value);
          }
        }
      };

      const measure = () => {
        step =
          cards.length > 1
            ? cards[1].offsetLeft - cards[0].offsetLeft
            : cards[0].offsetWidth;
        lastTransform = "";
        render(state.pos);
      };

      measure();

      // ----- Barrel distortion (lensa seluas stage, hanya untuk deretan kartu;
      // judul dan label tidak ikut melengkung) -----
      let teardownLens: (() => void) | undefined;

      if (barrel && map && disp && !reduce && !lowPower) {
        let width = layer.offsetWidth;
        let k = 0;
        let appliedK = -1;
        let lastPos = state.pos;
        let lensOn = false;
        let mapTimer: number | undefined;

        const applyBarrel = () => {
          // Lewati kalau perubahannya terlalu kecil untuk terlihat.
          if (Math.abs(k - appliedK) < 0.002) return;

          appliedK = k;
          disp.setAttribute("scale", String((width * k) / BARREL_MAX));
        };
        const applyMap = () => {
          map.setAttribute(
            "href",
            createBarrelMap(layer.offsetHeight / Math.max(layer.offsetWidth, 1))
          );
        };
        const applySize = () => {
          width = layer.offsetWidth;

          const height = layer.offsetHeight;

          barrel.setAttribute("width", String(width));
          barrel.setAttribute("height", String(height));
          map.setAttribute("width", String(width));
          map.setAttribute("height", String(height));
          appliedK = -1;
          applyBarrel();
          // Peta bergantung pada rasio stage, jadi dibuat ulang saat resize.
          window.clearTimeout(mapTimer);
          mapTimer = window.setTimeout(applyMap, 120);
        };

        applyMap();
        applySize();

        const resizeObserver = new ResizeObserver(applySize);

        resizeObserver.observe(layer);

        // Tiap frame: kecepatan geser (kartu/detik) -> target kekuatan lensa,
        // diperhalus supaya masuk dan mengendurnya terasa mulus. Filter hanya
        // dipasang saat lensa benar-benar aktif, jadi gambar tajam saat diam.
        const tick = (_time: number, deltaTime: number) => {
          // Diam dan lensa sudah mati: tidak ada yang perlu dihitung.
          if (k === 0 && state.pos === lastPos) return;
          if (deltaTime <= 0) return;

          const dt = deltaTime / 1000;
          const speed = Math.abs(state.pos - lastPos) / dt;

          lastPos = state.pos;

          const target = Math.min(BARREL_PEAK, speed * BARREL_GAIN);

          k += (target - k) * (1 - Math.exp(-dt * BARREL_RESPONSE));

          if (k < 0.004) {
            k = 0;
            appliedK = -1;
            if (lensOn) {
              lensOn = false;
              layer.style.filter = "";
            }
            return;
          }

          if (!lensOn) {
            lensOn = true;
            layer.style.filter = "url(#works-barrel)";
          }
          applyBarrel();
        };

        gsap.ticker.add(tick);

        teardownLens = () => {
          gsap.ticker.remove(tick);
          window.clearTimeout(mapTimer);
          resizeObserver.disconnect();
          layer.style.filter = "";
        };
      }

      // Rentang scroll section: masuk -> geser kartu -> keluar. Rasio ketiganya
      // dikunci saat dibuat supaya tetap proporsional saat resize.
      const vh = svhPx();
      const cardsPx = () =>
        Math.max(1, Math.round((TOTAL - 1) * Math.max(vh * SCROLL_PER_PROJECT, 320)));
      const entryUnits = (ENTRY_SCREENS * vh) / cardsPx();
      const exitUnits = (EXIT_SCREENS * vh) / cardsPx();
      // Animasi keluar hanya memakai bagian awal; sisanya jeda sebelum Contact.
      const animUnits =
        ((EXIT_SCREENS - CONTACT_OVERLAP + ANIM_OVERLAP) * vh) / cardsPx();
      const totalUnits = entryUnits + 1 + exitUnits;
      const entryFrac = entryUnits / totalUnits;
      const cardsFrac = 1 / totalUnits;

      cardsRangeRef.current = { from: entryFrac, span: cardsFrac };

      // Animasi keluar: tangga hitam (clip-path) menutup layar.
      const exitCover = root.querySelector<HTMLElement>("[data-exit-cover]");
      const exitEls = gsap.utils.toArray<HTMLElement>("[data-exit]", root);
      const cover = { p: 0 };
      let lastClip = "";
      const applyCover = () => {
        if (!exitCover) return;

        const clip = stairClip(cover.p, true);

        if (clip !== lastClip) {
          lastClip = clip;
          exitCover.style.clipPath = clip;
        }
      };

      applyCover();

      // Section tersembunyi (dan tidak menangkap pointer) sampai pin dimulai,
      // yaitu saat tangga merah Skills sudah penuh. Begitu pin dimulai, latar
      // merah section ini tampil (sama persis dengan yang di bawahnya). Elemen
      // lalu muncul MENGIKUTI SCROLL (bukan animasi berbasis waktu), jadi tidak
      // ada loncatan: kartu naik, teks kecil menyusul, judul muncul di tengah
      // fase masuk.
      const pSpans = gsap.utils.toArray<HTMLElement>("p[data-exit] > span", root);
      let on = false;
      let titleOn = false;

      const sync = (self: ScrollTrigger) => {
        // Dihitung dari posisi scroll nyata (bukan self.progress) supaya tidak
        // salah saat ScrollTrigger sedang refresh.
        const span = self.end - self.start;
        const progress =
          span > 0
            ? gsap.utils.clamp(0, 1, (self.scroll() - self.start) / span)
            : 0;
        const visible = progress > 0;

        if (visible !== on) {
          on = visible;
          root.style.visibility = on ? "visible" : "hidden";
          root.style.pointerEvents = on ? "auto" : "none";
        }

        const title = progress >= entryFrac * 0.35;

        if (title !== titleOn) {
          titleOn = title;
          setShown(title);
        }
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          // Tanpa pin GSAP: section menempel dengan position: sticky bawaan
          // browser (sama seperti Skills) di dalam wrapper yang tingginya =
          // 1 layar + jarak scroll, jadi tidak ada peralihan fixed <-> normal
          // yang bisa menimbulkan celah, terutama saat scroll balik.
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          // Dihitung lebih dulu dari trigger section lain (mis. Contact)
          // supaya jarak pin sudah masuk saat posisi mereka dihitung.
          refreshPriority: 1,
          // Berhenti tepat saat satu kartu berada di tengah. Hanya di fase
          // geser kartu: fase masuk dan keluar scroll bebas tanpa snap.
          snap:
            TOTAL > 1
              ? {
                  snapTo: (value: number) => {
                    if (value < entryFrac || value > entryFrac + cardsFrac) {
                      return value;
                    }

                    const step = cardsFrac / (TOTAL - 1);

                    return (
                      entryFrac +
                      Math.round((value - entryFrac) / step) * step
                    );
                  },
                  duration: { min: 0.25, max: 0.6 },
                  delay: 0.08,
                  ease: "power2.inOut",
                }
              : undefined,
          onUpdate: sync,
          onRefresh: (self) => {
            measure();
            sync(self);
          },
        },
      });

      // Fase masuk (0 .. entryUnits): kartu fade in bergantian, lalu teks kecil
      // kiri-kanan menyusul (setelah tirai merah selesai).
      tl.fromTo(
        cards,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: entryUnits * 0.6,
          stagger: { amount: entryUnits * 0.4, from: "start" },
          ease: "power1.out",
        },
        0
      );
      tl.fromTo(
        pSpans,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: entryUnits * 0.4,
          stagger: { amount: entryUnits * 0.15, from: "start" },
          ease: "power1.out",
        },
        entryUnits * 0.45
      );

      // Fase geser kartu (entryUnits .. entryUnits + 1).
      tl.to(
        state,
        {
          pos: TOTAL - 1,
          duration: 1,
          onUpdate: () => {
            render(state.pos);

            const next = Math.round(state.pos);

            // Hanya update state kalau proyek aktif benar-benar berganti,
            // bukan di setiap frame scroll.
            if (next !== activeRef.current) {
              activeRef.current = next;
              setActive(next);
            }
          },
        },
        entryUnits
      );

      // Fase keluar: isi fade out, lalu tangga hitam menutup.
      const exitAt = entryUnits + 1;

      tl.to(
        layer,
        {
          autoAlpha: 0,
          duration: animUnits * 0.55,
          ease: "power1.in",
        },
        exitAt
      );
      tl.to(
        exitEls,
        {
          autoAlpha: 0,
          duration: animUnits * 0.4,
          stagger: animUnits * 0.06,
          ease: "power1.in",
        },
        exitAt
      );
      tl.to(
        cover,
        {
          p: 1,
          duration: animUnits * 0.85,
          onUpdate: applyCover,
        },
        exitAt + animUnits * 0.15
      );
      // Pastikan timeline tetap sepanjang totalUnits (jeda di akhir untuk Contact).
      tl.to({}, { duration: 0 }, totalUnits);

      stRef.current = tl.scrollTrigger ?? null;
      if (tl.scrollTrigger) sync(tl.scrollTrigger);

      return () => {
        teardownLens?.();
        stRef.current = null;
        root.style.visibility = "";
        root.style.pointerEvents = "";
      };
    },
    { scope: rootRef }
  );

  // ===== Tirai merah (lapisan fixed seukuran layar) =====
  // Tangga merah tumbuh menutupi Skills lalu tetap menjadi latar Works sampai
  // animasi keluar selesai. Karena fixed + inset-0, ukurannya SELALU persis
  // layar: tidak ada celah di bawah/atas apa pun yang dilakukan section lain
  // (sticky Skills terangkat, pin, dll), baik saat scroll maju maupun balik.
  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const curtain = curtainRef.current;

      if (!wrap || !curtain) return;

      let last = "";
      const apply = (p: number) => {
        const clip = stairClip(p);

        if (clip !== last) {
          last = clip;
          curtain.style.clipPath = clip;
        }
      };

      apply(0);

      // Tangga tumbuh selama STAIR_IN_SCREENS layar sebelum Works menempel.
      const stairStart = () =>
        `top ${Math.round(svhPx() * STAIR_IN_SCREENS)}px`;

      ScrollTrigger.create({
        trigger: wrap,
        start: stairStart,
        end: "top top",
        scrub: 0.9,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });

      // Tirai hanya tampil dari awal tangga sampai akhir animasi keluar
      // (saat itu tangga hitam sudah menutup penuh).
      const setVisible = (self: ScrollTrigger) => {
        curtain.style.visibility = self.isActive ? "visible" : "hidden";
      };

      ScrollTrigger.create({
        trigger: wrap,
        start: stairStart,
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onToggle: setVisible,
        onRefresh: setVisible,
      });
    },
    { scope: wrapRef }
  );

  return (
    <div
      ref={wrapRef}
      style={{
        // 1 layar (yang menempel) + jarak scroll: kartu per proyek, fase masuk,
        // dan fase keluar. Harus sama dengan hitungan di useGSAP.
        height: `calc(100svh + ${TOTAL - 1} * max(${SCROLL_PER_PROJECT * 100}svh, 320px) + ${(ENTRY_SCREENS + EXIT_SCREENS) * 100}svh)`,
        minHeight: "100vh",
      }}
    >
      {/* Tirai merah: fixed seukuran layar, di dalam wrapper Works (yang sudah
          berada di atas Skills) dan di bawah section Works (sticky). */}
      <div
        ref={curtainRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed inset-0"
        style={{
          backgroundColor: BG_COLOR,
          clipPath: "polygon(0% 0%,0% 0%,0% 100%)",
        }}
      />
      <section
        ref={rootRef}
        id="works"
        aria-label="Karya"
        className="pointer-events-none invisible sticky top-0 isolate h-svh min-h-screen w-full overflow-hidden"
      >
        {/* Filter barrel distortion untuk deretan kartu (peta displacement dan
          ukuran diisi dari JS). */}
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          className="pointer-events-none absolute"
        >
          <filter
            id="works-barrel"
            x="0"
            y="0"
            width="300"
            height="225"
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              id="works-barrel-map"
              x="0"
              y="0"
              width="300"
              height="225"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              id="works-barrel-disp"
              in="SourceGraphic"
              in2="map"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>

        {/* Jendela tetap setinggi layar; kartu yang bergeser dipotong di sini
          supaya tidak keluar ke section lain. */}
        <div
          ref={stageRef}
          className="absolute inset-0 overflow-hidden [--card-w:72vw] sm:[--card-w:min(52vw,calc(62svh*1.6))]"
          style={{ contain: "paint" }}
        >
          {/* Layer lensa: seukuran stage, tempat filter barrel dipasang. */}
          <div data-lens-layer className="absolute inset-0">
            {/* Deretan kartu: dimulai dengan kartu pertama tepat di tengah. */}
            <div
              data-track
              className="absolute left-0 top-0 flex h-full items-center will-change-transform"
              style={
                {
                  gap: CARD_GAP,
                  paddingLeft: "calc(50% - var(--card-w) / 2)",
                } as CSSProperties
              }
            >
              {SORTED_PROJECTS.map((project, index) => (
                <button
                  key={project.slug}
                  type="button"
                  data-card
                  data-works-project
                  aria-haspopup={index === active ? "dialog" : undefined}
                  aria-current={index === active ? "true" : undefined}
                  aria-label={
                    index === active
                      ? `Buka detail ${project.title}`
                      : `Tampilkan ${project.title}`
                  }
                  onClick={(event) =>
                    index === active
                      ? openProject(index, event.currentTarget)
                      : goTo(index)
                  }
                  style={{
                    width: "var(--card-w)",
                    height: "calc(var(--card-w) / 1.6)",
                  }}
                  className="relative block shrink-0 cursor-pointer overflow-hidden rounded-[3px] bg-black/20 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={SLIDE_IMAGES[index][0].src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full select-none object-cover object-center"
                  />
                  {/* Lapisan gelap: makin pekat untuk kartu yang jauh dari tengah */}
                  <span
                    aria-hidden="true"
                    data-shade
                    className="pointer-events-none absolute inset-0 bg-black opacity-0"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Vinyet gelap di tepi layar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)",
          }}
        />

        {/* Judul proyek aktif: besar, di tengah, melintasi kartu */}
        <div
          aria-hidden="true"
          data-exit
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-[4vw]"
        >
          <div
            ref={titleRef}
            className="flex flex-wrap justify-center gap-x-[0.28em] text-center font-acerok text-[clamp(26px,5.2vw,92px)] uppercase leading-[1.05] tracking-[0.02em] text-white"
            style={{ textShadow: "0 2px 28px rgba(0,0,0,0.4)" }}
          >
            {titleWords.map((word, wi) => (
              <span
                key={`${active}-${wi}`}
                className="inline-flex whitespace-nowrap"
              >
                {Array.from(word).map((char, ci) => (
                  <span key={ci} data-char className="inline-block">
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* Deskripsi kecil proyek aktif (gaya sama dengan teks kecil di Contact).
          Desktop: kiri & kanan. Mobile (< 640px): atas (rata kiri) & bawah (rata kanan) kartu. */}
        <p data-exit className="pointer-events-none absolute left-[2vw] top-[48%] z-10 max-w-[28vw] font-switzer text-[10px] font-medium lowercase leading-[1.1] tracking-[-0.05em] text-white max-sm:top-[26%] max-sm:max-w-[60vw] lg:max-w-[16vw] lg:text-[0.72vw]">
          <span className="block">{activeProject?.category}</span>
          <span className="block">{activeProject?.description}</span>
        </p>
        <p data-exit className="pointer-events-none absolute right-[2vw] top-[48%] z-10 max-w-[28vw] text-right font-switzer text-[10px] font-medium lowercase leading-[1.1] tracking-[-0.05em] text-white max-sm:top-auto max-sm:bottom-[26%] max-sm:max-w-[60vw] lg:max-w-[16vw] lg:text-[0.72vw]">
          <span className="block">
            {activeProject?.role ?? FALLBACK_ROLE[activeProject.category]}
          </span>
          {activeProject?.year && (
            <span className="block">{activeProject.year}</span>
          )}
        </p>

        {/* Tangga hitam untuk animasi keluar: tumbuh dari kanan atas menutupi
          section sebelum section berikutnya masuk. */}
        <div
          aria-hidden="true"
          data-exit-cover
          className="pointer-events-none absolute inset-0 z-[30]"
          style={{
            backgroundColor: EXIT_COLOR,
            clipPath: "polygon(100% 0%,100% 0%,100% 100%)",
          }}
        />

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
                  backdropFilter: "blur(16px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(16px) saturate(1.2)",
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
    </div>
  );
}