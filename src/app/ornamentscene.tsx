"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";
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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Part = {
  key: PieceKey;
  sep: THREE.Group; // lapisan khusus scroll (posisi home + offset pemisahan)
  pivot: THREE.Group; // lapisan khusus entrance & idle (relatif terhadap sep)
  home: THREE.Vector3;
  halfW: number;
};

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  onUnsupported: () => void;
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

    // Cek ketersediaan WebGL secara aman sebelum inisialisasi Three.js
    // agar browser tidak mencatat unhandled context error jika GPU terblokir sementara
    try {
      const testCanvas = document.createElement("canvas");
      const gl =
        testCanvas.getContext("webgl2") ||
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl");
      if (!gl) {
        console.warn("[OrnamentScene] WebGL tidak tersedia, memakai fallback 2D.");
        onUnsupportedRef.current();
        return;
      }
      // Lepas konteks tes agar tidak menumpuk dan membuat konteks utama dibuang browser
      (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    } catch (err) {
      console.warn("[OrnamentScene] Pengecekan WebGL gagal, memakai fallback 2D.", err);
      onUnsupportedRef.current();
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.warn("[OrnamentScene] WebGLRenderer gagal dibuat, memakai fallback 2D.", err);
      onUnsupportedRef.current();
      return;
    }

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "pointer-events-none fixed inset-0 z-30 h-full w-full";
    container.appendChild(canvas);

    // Jika context hilang dan tidak pulih dalam jeda ini, pakai fallback 2D.
    const CONTEXT_RESTORE_TIMEOUT_MS = 3000;
    let restoreTimer: ReturnType<typeof setTimeout> | undefined;

    const onContextLost = (e: Event) => {
      e.preventDefault(); // Wajib supaya browser boleh memulihkan context (webglcontextrestored)
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => {
        if (!disposed) {
          console.warn("[OrnamentScene] WebGL context hilang dan tidak pulih, memakai fallback 2D.");
          onUnsupportedRef.current();
        }
      }, CONTEXT_RESTORE_TIMEOUT_MS);
    };
    const onContextRestored = () => {
      clearTimeout(restoreTimer);
      layout(); // three.js memulihkan state sendiri; cukup sinkronkan ulang ukuran/kamera
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

    const layout = () => {
      const host = canvas.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const W = host.width;
      const H = host.height;
      if (!W || !H || !a.width) return;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
    let aboutCache: Element | null = null;
    let lastY = typeof window !== "undefined" ? window.scrollY : 0;
    let smoothP = 0;
    let smoothTiltX = 0;

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
      const targetP = clamp01(1 - abTop / (window.innerHeight || 1));

      // About sudah lewat jauh: ornamen tidak dirender, jadi lewati seluruh kalkulasi scene.
      // State dibuat sama dengan hasil konvergensi versi sebelumnya (smoothP -> target, tilt -> 0),
      // dan semua posisi dihitung ulang penuh pada frame pertama saat About terlihat lagi.
      if (aboutRect && aboutRect.bottom <= -100) {
        smoothP = targetP;
        smoothTiltX = 0;
        lastY = y;
        visible = false;
        return;
      }

      // Exponential damping untuk kelembaman elastis yang ultra-halus (anti-snap)
      smoothP = reduce
        ? targetP
        : smoothP + (targetP - smoothP) * (1 - Math.exp(-dt * 6.5));

      // Animasi transisi perpindahan ornamen 3D ke posisi About secara continuous (tanpa jeda terhenti)
      if (scrollActive && parts.length) {
        const landingProgress = smoothP;
        const eLanding = easeInOutCubic(landingProgress);
        const arc = reduce ? 0 : Math.sin(Math.PI * landingProgress) * (1 - eLanding); // lift halus hanya saat meluncur turun

        const scrollAwayZ = Math.min(0, abTop) / (currentPpu || 1);

        // Posisi ornamen: meluncur turun mulus ke About anchor dan bergerak bersama About saat scroll naik
        scrollRoot.position.x = centerShiftX * eLanding;
        scrollRoot.position.z = centerShiftZ * eLanding + scrollAwayZ;
        scrollRoot.position.y = arc * 0.12 * artWidth; // meliuk sedikit ke arah kamera saat berpindah
        scrollRoot.scale.setScalar(THREE.MathUtils.lerp(1, sepScale, eLanding));

        const time = performance.now() * 0.001;
        // Ornamen melayang tenang (subtle floating breathing)
        const fY = reduce ? 0 : Math.sin(time * 1.5) * 0.016;
        const fRotX = reduce ? 0 : Math.cos(time * 1.2) * 0.022;
        const fRotZ = reduce ? 0 : Math.sin(time * 1.4) * 0.025;

        // Rotasi fluida saat berpindah turun (meredup halus ke 0 saat sudah sampai di About)
        const glideRotX = reduce ? 0 : Math.sin(Math.PI * landingProgress) * (1 - eLanding) * 0.28;
        const glideRotY = reduce ? 0 : Math.sin(Math.PI * landingProgress) * (1 - eLanding) * 0.18;

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
      // posisi About: ornamen bergerak bersama About, jadi tak terlihat lagi setelah About lewat.
      visible = !aboutRect || aboutRect.bottom > -100;

      if (visible) renderer.render(scene, camera);
    };

    const init = async () => {
      const loader = new GLTFLoader();
      const keys = Object.keys(FILES) as PieceKey[];
      const gltfs = await Promise.all(keys.map((k) => loader.loadAsync(FILES[k])));
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
        console.error("[OrnamentScene] Gagal inisialisasi scene 3D, memakai fallback 2D:", err);
        onUnsupportedRef.current();
      }
    });

    gsap.ticker.add(tick);
    cleanups.push(() => gsap.ticker.remove(tick));

    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    ro.observe(anchor);
    // Anchor tujuan di About juga diamati: posisinya bisa bergeser (mis. setelah font termuat)
    const aboutAnchorEl = document.querySelector("#about-ornament-anchor");
    if (aboutAnchorEl) ro.observe(aboutAnchorEl);
    document.fonts?.ready.then(() => {
      if (!disposed) layout();
    });
    cleanups.push(() => ro.disconnect());

    cleanups.push(() => {
      clearTimeout(restoreTimer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
    });

    return () => {
      disposed = true;
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