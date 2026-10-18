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

const STAGGER_SPAN = 0.75; // tiap potongan memakai 75% rentang scroll untuk staggered effect
const SEP_SCALE_MAX = 0.85; // skala maksimum saat terpisah

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smoothstep = (t: number) => t * t * (3 - 2 * t);

type SeparationTarget = {
  x: number;
  z: number;
  lift: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  delay: number;
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
  onUnsupported: () => void;
};

export default function OrnamentScene({
  anchorRef,
  onUnsupported,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onUnsupportedRef = useRef(onUnsupported);
  onUnsupportedRef.current = onUnsupported;

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
        onUnsupportedRef.current();
        return;
      }
    } catch {
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
    } catch {
      onUnsupportedRef.current();
      return;
    }

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "pointer-events-none fixed inset-0 z-10 h-full w-full";
    container.appendChild(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault(); // Wajib untuk mencegah browser memblokir WebGL context di domain ini
    };
    canvas.addEventListener("webglcontextlost", onContextLost, false);

    let disposed = false;
    const cleanups: Array<() => void> = [];

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
    let sepScale = SEP_SCALE_MAX;
    let sepST: ScrollTrigger | null = null;
    let scrollActive = false;

    // Target posisi terpisah dinamis, dihitung proporsional terhadap ukuran layar
    let separationTargets: Record<PieceKey, SeparationTarget> = {
      A: { x: -0.45, z: 0.04, lift: 0.08, rotX: 0.22, rotY: -0.65, rotZ: 0.16, scale: 0.95, delay: 0 },
      F: { x: 0, z: -0.12, lift: 0.16, rotX: 0.35, rotY: 0.12, rotZ: 0, scale: 0.88, delay: 0.08 },
      R: { x: 0.45, z: 0.06, lift: 0.08, rotX: -0.18, rotY: 0.65, rotZ: -0.18, scale: 0.95, delay: 0.16 },
    };

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
      const cx = a.left - host.left + a.width / 2;
      const cy = a.top - host.top + a.height / 2;

      const dist = H / ppu / (2 * Math.tan(THREE.MathUtils.degToRad(FOV) / 2));
      const xc = center.x - (cx - W / 2) / ppu;
      const zc = center.z - (cy - H / 2) / ppu;

      // Jarak vertikal dari posisi ornamen di hero ke tengah layar (Z+ = ke bawah)
      centerShiftZ = -(cy - H / 2) / ppu;

      // Hitung penyebaran proporsional agar potongan tidak terlalu dekat dengan tepi viewport
      const isDesktop = W >= 1024;
      const isTablet = W >= 640 && W < 1024;

      let spreadPx = W * 0.25;
      if (isDesktop) {
        spreadPx = Math.min(W * 0.25, 360); // Jarak aman yang lega dari tepi viewport
      } else if (isTablet) {
        spreadPx = Math.min(W * 0.23, 210);
      } else {
        spreadPx = Math.min(W * 0.19, 90);
      }

      const sepX = spreadPx / ppu;
      const sepZF = -(Math.min(H * 0.14, 110)) / ppu;
      const sepZA = +(Math.min(H * 0.04, 35)) / ppu;
      const sepZR = +(Math.min(H * 0.06, 50)) / ppu;

      sepScale = isDesktop ? 0.70 : (isTablet ? 0.62 : 0.54);

      separationTargets = {
        A: {
          x: -sepX,
          z: sepZA,
          lift: 0.10 * artWidth,
          rotX: 0.24,
          rotY: -0.62,
          rotZ: 0.18,
          scale: 0.96,
          delay: 0,
        },
        F: {
          x: 0,
          z: sepZF,
          lift: 0.18 * artWidth,
          rotX: 0.38,
          rotY: 0.12,
          rotZ: 0,
          scale: 0.90,
          delay: 0.08,
        },
        R: {
          x: sepX,
          z: sepZR,
          lift: 0.10 * artWidth,
          rotX: -0.20,
          rotY: 0.62,
          rotZ: -0.20,
          scale: 0.96,
          delay: 0.16,
        },
      };

      camera.position.set(xc, dist, zc);
      camera.lookAt(xc, 0, zc);
      camera.updateProjectionMatrix();
    };

    let visible = true;
    let lastY = window.scrollY;
    let smoothP = 0;
    let smoothTiltX = 0;
    let lastOpacity = -1;

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(Math.max(deltaMs, 1), 50) / 1000;
      const y = window.scrollY;

      // Target progress dari scroll
      let targetP = 0;
      if (sepST) {
        targetP = clamp01((y - sepST.start) / (sepST.end - sepST.start || 1));
      }

      // Exponential damping untuk kelembaman elastis (anti-kaku)
      smoothP += (targetP - smoothP) * (1 - Math.exp(-dt * 6.5));

      // Progres fade canvas setelah melewati section About
      let fadeP = 0;
      if (sepST) {
        const vh = window.innerHeight;
        const fStart = sepST.end + vh * 0.35;
        const fEnd = fStart + vh * 0.75;
        fadeP = clamp01((y - fStart) / (fEnd - fStart));
      }
      const opacity = 1 - smoothstep(fadeP);
      if (Math.abs(opacity - lastOpacity) > 0.001) {
        canvas.style.opacity = String(opacity);
        lastOpacity = opacity;
      }

      // Animasi transisi pemisahan potongan
      if (scrollActive && parts.length) {
        const p = smoothP;
        const eAll = easeInOutCubic(p);

        scrollRoot.position.z = centerShiftZ * eAll;
        scrollRoot.scale.setScalar(THREE.MathUtils.lerp(1, sepScale, eAll));

        const time = performance.now() * 0.001;
        const floatWeight = smoothstep(p); // semakin terpisah, semakin bebas mengapung

        parts.forEach((part) => {
          const cfg = separationTargets[part.key];
          const pp = clamp01((p - cfg.delay) / STAGGER_SPAN);
          const e = easeInOutCubic(pp);
          const arc = Math.sin(Math.PI * pp); // lengkungan lift saat transisi

          // Floating breathing khas karet mengapung di udara
          let fY = 0;
          let fRotX = 0;
          let fRotZ = 0;
          let scrollRotX = 0;

          if (part.key === "A") {
            fY = Math.sin(time * 1.6) * 0.016 * floatWeight;
            fRotX = Math.cos(time * 1.2) * 0.025 * floatWeight;
            fRotZ = Math.sin(time * 1.4) * 0.035 * floatWeight;
          } else if (part.key === "F") {
            fY = Math.sin(time * 1.3 + 1.5) * 0.022 * floatWeight;
            fRotX = Math.cos(time * 1.5 + 1.0) * 0.045 * floatWeight;
            fRotZ = 0; // Tanpa rotasi sumbu Z
            // Memutar sumbu X satu putaran penuh (360° / 2π) mengikuti scroll pengguna
            scrollRotX = Math.PI * 2 * e;
          } else if (part.key === "R") {
            fY = Math.sin(time * 1.7 + 3.0) * 0.016 * floatWeight;
            fRotX = Math.cos(time * 1.3 + 2.0) * 0.025 * floatWeight;
            fRotZ = -Math.sin(time * 1.4 + 2.0) * 0.035 * floatWeight;
          }

          part.sep.position.set(
            part.home.x + cfg.x * e,
            cfg.lift * arc + fY,
            part.home.z + cfg.z * e
          );

          part.sep.rotation.set(
            cfg.rotX * e + scrollRotX + fRotX,
            cfg.rotY * e,
            cfg.rotZ * e + fRotZ
          );

          // Efek elastisitas karet halus saat bergerak (squash & stretch)
          const stretch = 1 + arc * 0.04;
          const s = THREE.MathUtils.lerp(1, cfg.scale, e);
          part.sep.scale.set(s * stretch, s, s * stretch);
        });

        // Dynamic velocity tilt yang halus mengikuti scroll
        const v = (y - lastY) / dt;
        const targetTiltX = THREE.MathUtils.clamp(v / 3500, -1, 1) * 0.12;
        smoothTiltX += (targetTiltX - smoothTiltX) * (1 - Math.exp(-dt * 5));
        scrollRoot.rotation.x = smoothTiltX * (1 - fadeP);
      }
      lastY = y;

      if (visible && opacity > 0.002) renderer.render(scene, camera);
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

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollActive = !reduce;

      // ===== Scroll: potongan berpisah saat berpindah ke section About =====
      // Mulai langsung dari scroll 0 (tanpa "zona mati"), berlaku dua arah.
      const aboutEl = document.querySelector("#tentang");
      if (aboutEl) {
        sepST = ScrollTrigger.create({
          trigger: aboutEl,
          start: "top 85%", // Mulai transisi anggun saat section About mulai naik
          end: "top 15%",  // Selesai terpisah tepat saat teks About di tengah layar
          invalidateOnRefresh: true,
        });
        cleanups.push(() => {
          sepST?.kill();
          sepST = null;
          canvas.style.opacity = "";
        });
      }

      if (reduce) return; // langsung tampil menyatu

      // Set posisi awal potongan sebelum entrance
      parts.forEach((p) => {
        const e = ENTRANCE[p.key];
        p.pivot.position.set(e.pos[0], e.pos[1], e.pos[2]);
        p.pivot.rotation.set(e.rot[0], e.rot[1], e.rot[2]);
        p.pivot.scale.set(e.scale, e.scale, e.scale);
      });

      let entranceTimeline: gsap.core.Timeline | null = null;

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
        tl.add(() => {
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
        });
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

      // Parallax: bagian depan ornamen menghadap ke arah cursor
      if (window.matchMedia("(pointer: fine)").matches) {
        // Rotasi — ornamen miring mengikuti posisi mouse
        const rx = gsap.quickTo(assembly.rotation, "x", { duration: 0.9, ease: "power3.out" });
        const rz = gsap.quickTo(assembly.rotation, "z", { duration: 0.9, ease: "power3.out" });
        // Translasi — geser sedikit ke arah cursor untuk kesan kedalaman
        const tx = gsap.quickTo(assembly.position, "x", { duration: 1.2, ease: "power3.out" });
        const tz = gsap.quickTo(assembly.position, "z", { duration: 1.2, ease: "power3.out" });

        const baseX = assembly.position.x;
        const baseZ = assembly.position.z;

        const onMove = (ev: PointerEvent) => {
          const nx = ev.clientX / window.innerWidth - 0.5;   // -0.5 .. 0.5
          const ny = ev.clientY / window.innerHeight - 0.5;

          // Rotasi: permukaan depan menghadap ke cursor
          rx(ny * 0.45);     // miring atas-bawah
          rz(nx * -0.45);    // miring kiri-kanan

          // Translasi: geser posisi untuk parallax depth
          tx(baseX + nx * 0.025);
          tz(baseZ + ny * 0.018);
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

    init().catch(() => {
      if (!disposed) onUnsupportedRef.current();
    });

    gsap.ticker.add(tick);
    cleanups.push(() => gsap.ticker.remove(tick));

    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    ro.observe(anchor);
    cleanups.push(() => ro.disconnect());

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    cleanups.push(() => io.disconnect());

    cleanups.push(() => canvas.removeEventListener("webglcontextlost", onContextLost));

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
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
    />
  );
}