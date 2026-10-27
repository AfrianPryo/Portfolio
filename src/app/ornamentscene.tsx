"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";
import { SoftwareRenderer } from "./softwareRenderer";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Tiga potongan ornamen (A, F, R) dirender sebagai objek 3D di atas heading.
 * Posisi & ukuran akhirnya "dikunci" ke kotak <div> anchor di Hero.tsx,
 * jadi saat sudah menyatu, ornamen selalu pas di tempat yang sama dengan desain 2D.
 */

const FILES = {
  A: "/Agilism.glb", // bagian kiri
  F: "/Fgilism.glb", // bagian tengah
  R: "/Rgilism.glb", // bagian kanan
} as const;
type PieceKey = keyof typeof FILES;

const FOV = 22; // makin kecil = makin "datar" (mendekati ortografik)
const TRACE_RATIO = 1209 / 1217; // lebar isi SVG anchor dibanding kotaknya (ada padding trace)
const THICKNESS = 4; // ketebalan potongan dikali 4 supaya sisi sampingnya terlihat saat miring

// Posisi awal (offset dari posisi akhir), rotasi awal (radian), skala awal, dan jeda masuk.
// Sumbu: X = kanan layar, Y = menuju kamera, Z = ke bawah layar.
const ENTRANCE: Record<
  PieceKey,
  {
    pos: readonly [number, number, number];
    rot: readonly [number, number, number];
    scale: number;
    at: number;
  }
> = {
  A: { pos: [-0.62, 0.16, 0.1], rot: [0.9, -2.8, 1.6], scale: 0.7, at: 0 },
  F: { pos: [0, 0.3, -0.45], rot: [2.6, 0.9, 0], scale: 0.45, at: 0.18 },
  R: { pos: [0.62, 0.16, -0.12], rot: [-0.9, 2.8, -1.6], scale: 0.7, at: 0.3 },
};

gsap.registerPlugin(ScrollTrigger);

const SEP_SCALE_MAX = 0.85; // skala maksimum saat terpisah

// Fase 2 (About -> Experience), dalam kelipatan tinggi viewport diukur dari atas layar ke pusat anchor Experience:
// ornamen mulai bergerak saat pusat anchor berada di EXP_START (>1 = masih di bawah layar, jadi mulai lebih awal)
// dan mendarat saat pusat anchor mencapai EXP_END (makin besar = mendarat lebih awal).
const EXP_START = 1.1;
const EXP_END = 0.6;

// Fase 3 (Experience -> Running Text): ornamen turun dari atas layar ke pusat section running teks.
// Mulai saat pusat anchor berada di RUN_START x tinggi viewport (dari atas), mendarat di RUN_END.
const RUN_START = 1.6; // makin besar = mulai lebih awal & rentang scroll lebih panjang (animasi lebih lambat)
const RUN_END = 0.5; // 0.5 = mendarat saat section tepat di tengah layar
const RUN_DROP_FROM = 0.45; // batas awal turun di atas layar (kelipatan tinggi viewport)
// Section Running Text dianggap "hidup" (ornamen dirender) mulai sejauh ini di bawah/atas layar (kelipatan tinggi viewport).
// Dibuat lebar supaya render tidak terputus oleh early-exit sebelum fase 3 sempat berjalan.
const RUN_ALIVE_MARGIN = 0.6;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Antarmuka minimal yang dipakai scene: dipenuhi WebGLRenderer maupun SoftwareRenderer (tanpa GPU)
type SceneRenderer = {
  domElement: HTMLCanvasElement;
  toneMapping: number;
  toneMappingExposure: number;
  setClearColor: (color: THREE.ColorRepresentation, alpha?: number) => void;
  setPixelRatio: (ratio: number) => void;
  setSize: (width: number, height: number, updateStyle?: boolean) => void;
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;
  clear: () => void;
  dispose: () => void;
  forceContextLoss: () => void;
};

type Part = {
  key: PieceKey;
  sep: THREE.Group; // lapisan khusus scroll (posisi home + offset pemisahan)
  pivot: THREE.Group; // lapisan khusus entrance & idle (relatif terhadap sep)
  home: THREE.Vector3;
  halfW: number;
};

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  /** Opsional: dipanggil bila WebGL benar-benar tidak tersedia (tidak ada fallback 2D/SVG). */
  onUnsupported?: () => void;
};

export default function OrnamentScene({
  anchorRef,
  onUnsupported,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onUnsupportedRef = useRef(onUnsupported);
  useEffect(() => {
    onUnsupportedRef.current = onUnsupported;
  });

  useEffect(() => {
    const container = containerRef.current;
    const anchor = anchorRef.current;
    if (!container || !anchor) return;

    // Buat context WebGL2 secara senyap (getContext mengembalikan null tanpa console.error),
    // lalu pakai ulang untuk renderer. Beberapa konfigurasi GPU/driver menolak opsi tertentu
    // (mis. powerPreference "high-performance" atau antialias), jadi coba beberapa kombinasi
    // dari yang terbaik sampai yang paling longgar sebelum menyerah.
    const ATTEMPTS: WebGLContextAttributes[] = [
      { alpha: true, antialias: true, powerPreference: "high-performance" },
      { alpha: true, antialias: true },
      { alpha: true, antialias: false },
      { alpha: true, antialias: false, powerPreference: "low-power" },
    ];
    let renderer: SceneRenderer | null = null;
    try {
      for (const attrs of ATTEMPTS) {
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2", attrs);
        if (!gl) continue;
        renderer = new THREE.WebGLRenderer({
          canvas: probe,
          context: gl,
          alpha: true,
          antialias: !!attrs.antialias,
        });
        break;
      }
    } catch (err) {
      console.warn("[OrnamentScene] WebGLRenderer gagal dibuat.", err);
      renderer = null;
    }
    if (!renderer) {
      // Tanpa WebGL (hardware acceleration mati / GPU diblokir): tetap render objek 3D yang sama
      // lewat rasterizer canvas 2D. Animasi identik, hanya pencahayaannya disederhanakan.
      console.info(
        "[OrnamentScene] WebGL2 tidak tersedia; memakai renderer perangkat lunak (canvas 2D). " +
          "Aktifkan hardware acceleration di browser untuk kualitas penuh."
      );
      try {
        renderer = new SoftwareRenderer();
      } catch (err) {
        console.warn("[OrnamentScene] Renderer perangkat lunak gagal dibuat.", err);
        onUnsupportedRef.current?.();
        return;
      }
    }

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "pointer-events-none fixed inset-0 z-30 h-full w-full";
    container.appendChild(canvas);

    // Jika context hilang dan belum pulih dalam jeda ini, beri peringatan (tanpa fallback 2D).
    const CONTEXT_RESTORE_TIMEOUT_MS = 10000; // GPU yang sedang sibuk bisa butuh beberapa detik untuk memulihkan context
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;

    const onContextLost = (e: Event) => {
      e.preventDefault(); // Wajib supaya browser boleh memulihkan context (webglcontextrestored)
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        if (!disposed) {
          console.warn("[OrnamentScene] WebGL context belum pulih setelah beberapa detik; masih menunggu pemulihan.");
        }
      }, CONTEXT_RESTORE_TIMEOUT_MS);
    };
    const onContextRestored = () => {
      clearTimeout(restoreTimer);
      layout(); // three.js memulihkan state sendiri; cukup sinkronkan ulang ukuran/kamera
      cleared = false;
    };
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    let disposed = false;
    const cleanups: Array<() => void> = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 10);
    camera.up.set(0, 0, -1); // kamera melihat dari atas; "atas layar" = -Z

    // Pencahayaan 3-titik untuk memunculkan kesan karet yang realistis
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(0.3, 1, -0.4);
    scene.add(key);

    // Fill light dari arah berlawanan — memberi pantulan lembut di sisi gelap
    const fill = new THREE.DirectionalLight(0xffd5d5, 1.0);
    fill.position.set(-0.5, 0.6, 0.3);
    scene.add(fill);

    // Rim light dari belakang — menegaskan siluet karet
    const rim = new THREE.DirectionalLight(0xffffff, 1.4);
    rim.position.set(0, -0.2, 0.8);
    scene.add(rim);

    // Material karet merah (rubber band)
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xdd0000,
      roughness: 0.42,
      metalness: 0,
      side: THREE.DoubleSide,
      clearcoat: 0.25,
      clearcoatRoughness: 0.45,
      sheen: 0.6,
      sheenRoughness: 0.35,
      sheenColor: new THREE.Color(0xff4444),
    });
    material.emissive.setRGB(0.18, 0, 0, THREE.LinearSRGBColorSpace);

    const assembly = new THREE.Group();
    scene.add(assembly);

    // Lapisan khusus scroll: dipisah dari assembly (entrance/parallax)
    const scrollRoot = new THREE.Group();
    assembly.add(scrollRoot);

    const parts: Part[] = [];
    const center = new THREE.Vector3();
    let artWidth = 1;
    let centerShiftZ = 0;
    let centerShiftX = 0;
    let sepScale = SEP_SCALE_MAX;
    let currentPpu = 1;
    let scrollActive = false;
    // Pusat & lebar anchor Hero (koordinat canvas), dipakai untuk menghitung posisi layar ornamen di fase 2
    let heroCX0 = 0;
    let heroCY0 = 0;
    let heroW = 1;

    const layout = () => {
      const host = canvas.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const W = host.width;
      const H = host.height;
      if (!W || !H || !a.width) return;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25)); // sama dengan FlameCursor: hemat memori GPU (iGPU berbagi RAM)
      renderer.setSize(W, H, false);
      camera.aspect = W / H;

      // piksel per unit dunia, supaya lebar ornamen = lebar kotak anchor
      const ppu = (a.width * TRACE_RATIO) / artWidth;
      currentPpu = ppu;

      // Ambil posisi scroll saat ini agar koordinat anchor Hero selalu invariant
      // (a.top dipengaruhi window.scrollY saat ini, sehingga kita tambahkan scrollY agar nilainya tidak bergeser ke atas saat refresh)
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollX = window.scrollX || document.documentElement.scrollLeft || 0;

      const heroCY = a.top + scrollY - host.top + a.height / 2;
      const heroCX = a.left + scrollX - host.left + a.width / 2;
      heroCX0 = heroCX;
      heroCY0 = heroCY;
      heroW = a.width;

      const dist = H / ppu / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2));
      const xc = center.x - (heroCX - W / 2) / ppu;
      const zc = center.z - (heroCY - H / 2) / ppu;

      // Hitung pergeseran posisi ornamen dari Hero ke About anchor
      const aboutAnchor = document.querySelector("#about-ornament-anchor");
      const aboutEl = document.querySelector("#tentang");

      let shiftZ = -(heroCY - H / 2) / ppu;
      let shiftX = 0;
      let scaleRatio = 1.0;

      if (aboutAnchor && aboutEl) {
        const abRect = aboutAnchor.getBoundingClientRect();
        const aboutRect = aboutEl.getBoundingClientRect();

        // Posisi target About anchor di viewport saat section About tiba di top viewport
        const targetYInViewport = abRect.top - aboutRect.top + abRect.height / 2;
        const targetXInViewport = abRect.left - aboutRect.left + abRect.width / 2;

        shiftZ = (targetYInViewport - heroCY) / ppu;
        shiftX = (targetXInViewport - heroCX) / ppu;
        scaleRatio = Math.max(0.7, Math.min(1.3, abRect.width / (a.width || 1)));
      }

      centerShiftZ = shiftZ;
      centerShiftX = shiftX;
      sepScale = scaleRatio;

      camera.position.set(xc, dist, zc);
      camera.lookAt(xc, 0, zc);
      camera.updateProjectionMatrix();
    };

    let visible = true;
    let cleared = false; // true = canvas sudah dikosongkan karena ornamen sedang tidak terlihat
    let aboutCache: Element | null = null;
    let expAnchorCache: Element | null = null;
    let expSectionCache: Element | null = null;
    let runAnchorCache: Element | null = null;
    let runSectionCache: Element | null = null;
    let runObserved: Element | null = null; // anchor Running Text yang sudah diamati ResizeObserver
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let smoothP = 0;
    let smoothP2 = 0; // progres fase 2 (About -> atas pilar di Experience)
    let smoothP3 = 0; // progres fase 3 (Experience -> pusat Running Text)
    let smoothTiltX = 0;
    let ro: ResizeObserver | null = null;

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(Math.max(deltaMs, 1), 50) / 1000;
      const y = window.scrollY;

      // Target progress dibaca langsung dari posisi About (0 saat About di bawah viewport, 1 saat di top)
      // Elemen di-cache dan rect dibaca sekali per frame (sebelumnya querySelector + 2x getBoundingClientRect).
      if (!aboutCache || !aboutCache.isConnected) {
        aboutCache = document.querySelector("#tentang");
      }
      const aboutEl = aboutCache;
      const aboutRect = aboutEl ? aboutEl.getBoundingClientRect() : null;
      const abTop = aboutRect ? aboutRect.top : 0;
      const vh = window.innerHeight || 1;
      const targetP = clamp01(1 - abTop / vh);

      // Fase 2: tujuan ornamen di Experience (anchor di atas pilar). Posisinya dibaca langsung tiap frame,
      // jadi ornamen selalu mendarat tepat di anchor walau layout/ukuran layar berubah.
      if (!expAnchorCache || !expAnchorCache.isConnected) {
        expAnchorCache = document.querySelector("#experience-ornament-anchor");
      }
      if (!expSectionCache || !expSectionCache.isConnected) {
        expSectionCache = document.querySelector("#experience");
      }
      const expRect = expAnchorCache ? expAnchorCache.getBoundingClientRect() : null;
      const expSectionRect = expSectionCache ? expSectionCache.getBoundingClientRect() : null;
      const hasExp = !!expRect && expRect.width > 0;
      const expCX = expRect ? expRect.left + expRect.width / 2 : 0;
      const expCY = expRect ? expRect.top + expRect.height / 2 : 0;
      const targetP2 = hasExp
        ? clamp01((vh * EXP_START - expCY) / (vh * (EXP_START - EXP_END)))
        : 0;

      // Fase 3: tujuan ornamen di pusat section Running Text.
      if (!runAnchorCache || !runAnchorCache.isConnected) {
        runAnchorCache = document.querySelector("#running-text-ornament-anchor");
      }
      if (!runSectionCache || !runSectionCache.isConnected) {
        runSectionCache = document.querySelector("#running-text");
      }
      // Section Running Text bisa baru ada di DOM setelah scene dibuat (hydration/lazy), jadi anchor-nya
      // diamati ResizeObserver begitu ditemukan (sebelumnya hanya dicek sekali saat scene dibuat).
      if (runAnchorCache && runAnchorCache !== runObserved && ro) {
        ro.observe(runAnchorCache);
        runObserved = runAnchorCache;
      }
      const runRect = runAnchorCache ? runAnchorCache.getBoundingClientRect() : null;
      const runSectionRect = runSectionCache ? runSectionCache.getBoundingClientRect() : null;
      const hasRun = !!runRect && runRect.width > 0;
      const runCX = runRect ? runRect.left + runRect.width / 2 : 0;
      const runCY = runRect ? runRect.top + runRect.height / 2 : 0;
      let targetP3 = hasRun
        ? clamp01((vh * RUN_START - runCY) / (vh * (RUN_START - RUN_END)))
        : 0;
      // Jika Running Text berada di dekat akhir halaman, pusat anchor-nya mungkin tidak pernah bisa
      // mencapai RUN_END (halaman sudah mentok), sehingga ornamen berhenti di tengah jalan / tidak terlihat.
      // Pada kondisi mentok di dasar halaman dan section sudah di layar, kunci ornamen ke anchor.
      if (hasRun && runSectionRect && runSectionRect.top < vh * 0.95) {
        const docH = Math.max(
          document.documentElement.scrollHeight,
          document.body ? document.body.scrollHeight : 0
        );
        const maxScroll = Math.max(0, docH - vh);
        if (maxScroll > 0 && y >= maxScroll - 4) targetP3 = 1;
      }
      const runAlive =
        !!runSectionRect &&
        runSectionRect.top < vh * (1 + RUN_ALIVE_MARGIN) &&
        runSectionRect.bottom > -vh * RUN_ALIVE_MARGIN;

      const aboutGone = !!aboutRect && aboutRect.bottom <= -100;
      const expAlive =
        !!expSectionRect && expSectionRect.top < vh + 100 && expSectionRect.bottom > -100;

      // About sudah lewat jauh DAN Experience/Running Text belum/sudah tidak di layar: ornamen tidak dirender,
      // jadi lewati seluruh kalkulasi scene. State dibuat sama dengan hasil konvergensi
      // (smoothP/smoothP2/smoothP3 -> target, tilt -> 0), dan semua posisi dihitung ulang penuh
      // pada frame pertama saat ornamen terlihat lagi.
      if (aboutGone && !expAlive && !runAlive) {
        smoothP = targetP;
        smoothP2 = targetP2;
        smoothP3 = targetP3;
        smoothTiltX = 0;
        lastY = y;
        visible = false;
        // Kosongkan canvas sekali supaya frame terakhir tidak "nyangkut" di layar
        // (canvas ini fixed, jadi frame lama tetap terlihat kalau tidak dihapus).
        if (!cleared) {
          renderer.clear();
          cleared = true;
        }
        return;
      }
      cleared = false;

      // Exponential damping untuk kelembaman elastis yang ultra-halus (anti-snap)
      smoothP = reduce
        ? targetP
        : smoothP + (targetP - smoothP) * (1 - Math.exp(-dt * 6.5));
      smoothP2 = reduce
        ? targetP2
        : smoothP2 + (targetP2 - smoothP2) * (1 - Math.exp(-dt * 6.5));
      // Fase 3 diredam lebih lembut (3.2 vs 6.5) supaya kemunculan di Running Text terasa lebih pelan
      smoothP3 = reduce
        ? targetP3
        : smoothP3 + (targetP3 - smoothP3) * (1 - Math.exp(-dt * 3.2));

      // Animasi transisi perpindahan ornamen 3D ke posisi About secara continuous (tanpa jeda terhenti)
      if (scrollActive && parts.length) {
        const landingProgress = smoothP;
        const eLanding = easeInOutCubic(landingProgress);
        const exitProgress = smoothP2;
        const eExit = easeInOutCubic(exitProgress);
        const eRun = easeInOutCubic(smoothP3);
        // lift halus hanya saat berpindah (Hero -> About, About -> Experience, Experience -> Running Text)
        const glide = reduce
          ? 0
          : Math.sin(Math.PI * landingProgress) * (1 - eLanding) +
            Math.sin(Math.PI * exitProgress) * (1 - eExit) +
            Math.sin(Math.PI * smoothP3) * (1 - eRun);

        const ppu = currentPpu || 1;
        const scrollAwayZ = Math.min(0, abTop) / ppu;

        // Fase 1: posisi ornamen meluncur turun mulus ke About anchor dan bergerak bersama About saat scroll naik
        const homeX = centerShiftX * eLanding;
        const homeZ = centerShiftZ * eLanding + scrollAwayZ;
        let posX = homeX;
        let posZ = homeZ;
        let scale = THREE.MathUtils.lerp(1, sepScale, eLanding);

        // Fase 2: dari posisi About, ornamen mengecil dan pindah ke anchor di atas pilar Experience.
        // Posisi layar ornamen saat ini = pusat anchor Hero + offset dunia * ppu.
        if (hasExp && expRect && heroW) {
          const curX = heroCX0 + homeX * ppu;
          const curY = heroCY0 + homeZ * ppu;
          posX = homeX + ((expCX - curX) * eExit) / ppu;
          posZ = homeZ + ((expCY - curY) * eExit) / ppu;
          scale = THREE.MathUtils.lerp(scale, expRect.width / heroW, eExit);
        }

        // Fase 3: ornamen turun dari atas layar dan mendarat di pusat running teks,
        // lalu terkunci ke anchor sehingga ikut bergerak bersama section.
        // Titik awal = posisi layar ornamen saat ini (anchor Experience), tapi dibatasi
        // paling jauh RUN_DROP_FROM x tinggi viewport di atas layar supaya turunnya tidak terlalu cepat
        // dan tetap kontinu (tanpa lompat) selama anchor Experience masih terlihat.
        // Titik awal juga dibatasi paling jauh di bawah layar (vh) supaya, bila anchor Experience
        // tidak ada / belum tercapai, ornamen tidak berangkat dari posisi yang tidak masuk akal.
        if (hasRun && runRect && heroW) {
          const curX = heroCX0 + posX * ppu;
          const curY = heroCY0 + posZ * ppu;
          const startY = Math.min(Math.max(curY, -vh * RUN_DROP_FROM), vh);
          const screenX = curX + (runCX - curX) * eRun;
          const screenY = startY + (runCY - startY) * eRun;
          posX = (screenX - heroCX0) / ppu;
          posZ = (screenY - heroCY0) / ppu;
          scale = THREE.MathUtils.lerp(scale, runRect.width / heroW, eRun);
        }

        // Jangan pernah jatuh ke skala 0/negatif (potongan lenyap dan tidak bisa dirender)
        scale = Math.max(0.02, scale);

        scrollRoot.position.x = posX;
        scrollRoot.position.z = posZ;
        scrollRoot.position.y = glide * 0.12 * artWidth; // meliuk sedikit ke arah kamera saat berpindah
        scrollRoot.scale.setScalar(scale);

        const time = performance.now() * 0.001;
        // Ornamen melayang tenang (subtle floating breathing)
        const fY = reduce ? 0 : Math.sin(time * 1.5) * 0.016;
        const fRotX = reduce ? 0 : Math.cos(time * 1.2) * 0.022;
        const fRotZ = reduce ? 0 : Math.sin(time * 1.4) * 0.025;

        // Rotasi fluida saat berpindah (meredup halus ke 0 saat sudah sampai di tujuan)
        const glideRotX = glide * 0.28;
        const glideRotY = glide * 0.18;

        parts.forEach((part) => {
          part.sep.position.set(part.home.x, fY, part.home.z);
          part.sep.rotation.set(fRotX, 0, fRotZ);
          part.sep.scale.set(1, 1, 1);
        });

        // Dynamic velocity tilt yang halus mengikuti scroll
        const v = (y - lastY) / dt;
        const targetTiltX = reduce ? 0 : THREE.MathUtils.clamp(v / 3500, -1, 1) * 0.12;
        smoothTiltX += (targetTiltX - smoothTiltX) * (1 - Math.exp(-dt * 5));
        scrollRoot.rotation.x = glideRotX + smoothTiltX;
        scrollRoot.rotation.y = glideRotY;
      }
      lastY = y;

      // Canvas berposisi fixed sehingga selalu "terlihat"; visibilitas ornamen ditentukan dari
      // posisi About, Experience, dan Running Text: ornamen ikut bergerak bersama ketiganya, jadi tak terlihat lagi
      // setelah About lewat (kecuali Experience/Running Text sedang di layar) dan setelah semuanya lewat.
      visible = !aboutGone || expAlive || runAlive;

      if (visible) renderer.render(scene, camera);
    };

    const init = async () => {
      const loader = new GLTFLoader();
      const keys = Object.keys(FILES) as PieceKey[];
      // Satu kali gagal fetch (jaringan lambat / putus sebentar) tidak boleh langsung
      // membuat ornamen 3D gagal total, jadi coba ulang beberapa kali dulu.
      const loadWithRetry = async (url: string, attempts = 3) => {
        let lastErr: unknown;
        for (let i = 0; i < attempts; i++) {
          if (disposed) throw new Error("disposed");
          try {
            return await loader.loadAsync(url);
          } catch (err) {
            lastErr = err;
            await new Promise((r) => setTimeout(r, 400 * (i + 1)));
          }
        }
        throw lastErr;
      };
      const gltfs = await Promise.all(keys.map((k) => loadWithRetry(FILES[k])));
      if (disposed) return;

      // 1) ukur posisi tiap potongan saat sudah menyatu
      const measured = keys.map((k, i) => {
        const obj = gltfs[i].scene;
        obj.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) mesh.material = material;
        });
        obj.updateMatrixWorld(true);
        return { key: k, obj, box: new THREE.Box3().setFromObject(obj) };
      });

      const total = new THREE.Box3();
      measured.forEach((m) => total.union(m.box));
      total.getCenter(center);
      artWidth = total.getSize(new THREE.Vector3()).x;
      assembly.position.copy(center);
      assembly.updateMatrixWorld(true);

      // 2) beri tiap potongan "pivot" di pusatnya sendiri supaya berputar di tempat
      measured.forEach(({ key: k, obj, box }) => {
        const home = box.getCenter(new THREE.Vector3()).sub(center);
        const sep = new THREE.Group();
        sep.position.copy(home);
        scrollRoot.add(sep);
        const pivot = new THREE.Group(); // di (0,0,0) relatif sep = pusat potongan
        sep.add(pivot);
        sep.updateMatrixWorld(true);
        pivot.attach(obj);

        // tebalkan ke arah belakang, permukaan atas tetap di bidang yang sama
        const topLocal = box.max.y - obj.getWorldPosition(new THREE.Vector3()).y;
        obj.scale.y = THICKNESS;
        obj.position.y += (1 - THICKNESS) * topLocal;

        parts.push({ key: k, sep, pivot, home, halfW: (box.max.x - box.min.x) / 2 });
      });

      layout();

      // Perpindahan Hero -> About mengikuti scroll 1:1, jadi tetap aktif walau reduced-motion.
      // Pada reduced-motion, efek dekoratif (melayang, miring, meliuk) dimatikan di tick().
      scrollActive = true;

      // Beri tahu section lain bahwa ornamen 3D aktif, supaya ornamen 2D cadangan di Experience disembunyikan.
      document.documentElement.setAttribute("data-ornament-3d", "on");

      // Sinkronkan progres awal jika halaman dimuat pada posisi scroll tertentu (cegah lonjakan)
      const aboutNode = document.querySelector("#tentang");
      if (aboutNode) {
        smoothP = clamp01(1 - aboutNode.getBoundingClientRect().top / (window.innerHeight || 1));
      }

      // Animasi pernapasan halus saat potongan sudah menyatu
      const startIdleBreathing = () => {
        parts.forEach((p, i) => {
          const dir = i % 2 ? -1 : 1;
          gsap.to(p.pivot.position, {
            z: dir * 0.0015,
            duration: 3.2 + i * 0.7,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
          gsap.to(p.pivot.rotation, {
            y: dir * 0.012,
            duration: 4 + i * 0.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });
      };

      const isScrolledPastHero = (window.scrollY || 0) > 50;
      let entranceTimeline: gsap.core.Timeline | null = null;

      // Jika prefers-reduced-motion ATAU pengguna me-refresh saat sudah berada di section bawah (misal About):
      // Potongan langsung dalam keadaan utuh menyatu di anchornya, tidak terbang ke angkasa.
      if (reduce || isScrolledPastHero) {
        parts.forEach((p) => {
          p.pivot.position.set(0, 0, 0);
          p.pivot.rotation.set(0, 0, 0);
          p.pivot.scale.set(1, 1, 1);
        });
        assembly.scale.set(1, 1, 1);
        if (!reduce) {
          startIdleBreathing();
        }
      } else {
        // Set posisi awal potongan sebelum entrance Hero
        parts.forEach((p) => {
          const e = ENTRANCE[p.key];
          p.pivot.position.set(e.pos[0], e.pos[1], e.pos[2]);
          p.pivot.rotation.set(e.rot[0], e.rot[1], e.rot[2]);
          p.pivot.scale.set(e.scale, e.scale, e.scale);
        });

        // ===== Entrance: tiga potongan terbang masuk lalu menyatu di tengah =====
        const triggerEntrance = () => {
          const tl = gsap.timeline();
          entranceTimeline = tl;
          parts.forEach((p) => {
            const e = ENTRANCE[p.key];
            tl.to(
              p.pivot.position,
              { x: 0, y: 0, z: 0, duration: 2.1, ease: "expo.out" },
              e.at
            );
            tl.to(
              p.pivot.rotation,
              { x: 0, y: 0, z: 0, duration: 2.4, ease: "power4.out" },
              e.at
            );
            tl.to(
              p.pivot.scale,
              { x: 1, y: 1, z: 1, duration: 1.8, ease: "power3.out" },
              e.at
            );
          });
          // hentakan kecil saat ketiganya "klik" bersatu
          tl.fromTo(
            assembly.scale,
            { x: 1.04, z: 1.04 },
            { x: 1, z: 1, duration: 1.4, ease: "elastic.out(1, 0.45)" },
            1.5
          );

          // setelah menyatu: bergerak sangat pelan supaya terasa hidup
          tl.add(startIdleBreathing);
        };

        let hasTriggered = false;
        const onTrigger = () => {
          if (hasTriggered || disposed) return;
          hasTriggered = true;
          triggerEntrance();
        };

        const isLifted =
          typeof window !== "undefined" &&
          Boolean((window as unknown as { __heroCurtainLifted?: boolean }).__heroCurtainLifted);

        if (isLifted) {
          onTrigger();
        } else {
          window.addEventListener("hero:curtain-lift", onTrigger, { once: true });
          cleanups.push(() => window.removeEventListener("hero:curtain-lift", onTrigger));
          // Failsafe: kalau event tirai tidak pernah datang (timeline Hero di-revert/dibunuh,
          // tab di background, dll.), potongan tidak boleh tertahan di pose awal selamanya.
          const failsafe = setTimeout(onTrigger, 6000);
          cleanups.push(() => clearTimeout(failsafe));
        }
      }

      // Parallax: bagian depan ornamen menghadap ke arah cursor — SELALU aktif di perangkat dengan pointer fine
      if (!reduce && window.matchMedia("(pointer: fine)").matches) {
        // Rotasi — ornamen miring mengikuti posisi mouse
        const rx = gsap.quickTo(assembly.rotation, "x", { duration: 0.9, ease: "power3.out" });
        const rz = gsap.quickTo(assembly.rotation, "z", { duration: 0.9, ease: "power3.out" });
        // Translasi — geser sedikit ke arah cursor untuk kesan kedalaman
        const tx = gsap.quickTo(assembly.position, "x", { duration: 1.2, ease: "power3.out" });
        const tz = gsap.quickTo(assembly.position, "z", { duration: 1.2, ease: "power3.out" });

        const baseX = assembly.position.x;
        const baseZ = assembly.position.z;

        const onMove = (ev: PointerEvent) => {
          const nx = ev.clientX / window.innerWidth - 0.5; // -0.5 .. 0.5
          const ny = ev.clientY / window.innerHeight - 0.5;

          // Rotasi: permukaan depan menghadap ke arah kursor
          rx(ny * 0.55); // miring atas-bawah
          rz(nx * -0.55); // miring kiri-kanan

          // Translasi: geser posisi untuk kedalaman parallax 3D yang nyata
          tx(baseX + nx * 0.045);
          tz(baseZ + ny * 0.035);
        };
        window.addEventListener("pointermove", onMove);
        cleanups.push(() => window.removeEventListener("pointermove", onMove));
      }

      cleanups.push(() => {
        entranceTimeline?.kill();
        parts.forEach((p) => {
          gsap.killTweensOf(p.pivot.position);
          gsap.killTweensOf(p.pivot.rotation);
          gsap.killTweensOf(p.pivot.scale);
        });
        gsap.killTweensOf(assembly.rotation);
        gsap.killTweensOf(assembly.position);
        gsap.killTweensOf(assembly.scale);
      });
    };

    init().catch((err) => {
      if (!disposed) {
        console.error("[OrnamentScene] Gagal inisialisasi scene 3D:", err);
        onUnsupportedRef.current?.();
      }
    });

    gsap.ticker.add(tick);
    cleanups.push(() => gsap.ticker.remove(tick));

    ro = new ResizeObserver(layout);
    ro.observe(canvas);
    ro.observe(anchor);
    // Anchor tujuan di About juga diamati: posisinya bisa bergeser (mis. setelah font termuat)
    const aboutAnchorEl = document.querySelector("#about-ornament-anchor");
    if (aboutAnchorEl) ro.observe(aboutAnchorEl);
    const runAnchorEl = document.querySelector("#running-text-ornament-anchor");
    if (runAnchorEl) {
      ro.observe(runAnchorEl);
      runObserved = runAnchorEl;
    }
    document.fonts?.ready.then(() => {
      if (!disposed) layout();
    });
    cleanups.push(() => ro?.disconnect());

    cleanups.push(() => {
      clearTimeout(restoreTimer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
    });

    return () => {
      disposed = true;
      document.documentElement.removeAttribute("data-ornament-3d");
      cleanups.forEach((fn) => fn());
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) mesh.geometry.dispose();
      });
      material.dispose();
      try {
        renderer.dispose();
        renderer.forceContextLoss();
      } catch {}
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, [anchorRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
    />
  );
}