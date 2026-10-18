"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface BurnPreloaderProps {
  onBurnStart?: () => void;
  onComplete?: () => void;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
}

export default function BurnPreloader({
  onBurnStart,
  onComplete,
}: BurnPreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const fillLogoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Pengguna prefers-reduced-motion: langsung skip tanpa animasi
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      onBurnStart?.();
      onComplete?.();
      setIsDone(true);
      return;
    }

    const canvas = canvasRef.current;
    const curtain = curtainRef.current;
    const fillLogo = fillLogoRef.current;

    if (!canvas || !curtain) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const burnState = {
      progress: 0,
      time: 0,
      started: false,
    };

    // Partikel bara api minimalis (maksimal 8-10 partikel saja agar sangat ringan)
    const MAX_EMBERS = 10;
    const embers: Ember[] = [];

    const spawnEmber = (x: number, y: number) => {
      if (embers.length >= MAX_EMBERS) return;
      embers.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - Math.random() * 8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 3 + 1.8),
        size: Math.random() * 1.5 + 1.2,
        alpha: 0.9,
        decay: Math.random() * 0.025 + 0.015,
      });
    };

    // Fungsi posisi Y garis dasar pembakaran (dari bawah layar height ke atas layar 0)
    const getBaseY = (progress: number) => {
      const extra = 140;
      return height + extra - progress * (height + extra * 2);
    };

    let animId: number;
    let burnTriggered = false;

    // Fungsi menggambar satu layer lidah api 2D (Stylized 2D Graphic Flame Tongues)
    const drawFlameLayer = (
      baseY: number,
      time: number,
      color: string,
      heightMultiplier: number,
      offsetPhase: number,
      flameWidth: number
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();

      const count = Math.ceil(width / flameWidth) + 2;
      const startX = -flameWidth;

      // Mulai dari luar kiri bawah
      ctx.moveTo(startX, height);

      // Gambar kurva lidah-lidah api 2D dari kiri ke kanan
      for (let i = 0; i < count; i++) {
        const xLeft = startX + i * flameWidth;
        const xRight = xLeft + flameWidth;
        const xMid = xLeft + flameWidth * 0.5;

        // Ketinggian lidah api dengan osilasi waktu meliuk
        const fHeight =
          (Math.sin(i * 1.3 + time * 3.8 + offsetPhase) * 22 +
            Math.cos(i * 0.7 - time * 2.5) * 15 +
            55) *
          heightMultiplier;

        // Kelengkungan meliuk ujung lidah api ke samping (tip sway)
        const tipSway = Math.sin(time * 4.2 + i * 1.1 + offsetPhase) * 18;
        const tipX = xMid + tipSway;
        const tipY = baseY - fHeight;

        // Titik kontrol kurva S meliuk khas lidah api 2D tribal/vektor
        const ctrl1X = xLeft + flameWidth * 0.25 - tipSway * 0.3;
        const ctrl1Y = baseY - fHeight * 0.45;

        const ctrl2X = xRight - flameWidth * 0.25 - tipSway * 0.3;
        const ctrl2Y = baseY - fHeight * 0.45;

        // Tarik garis kurva dari pangkal kiri -> puncak meliuk -> pangkal kanan
        ctx.bezierCurveTo(ctrl1X, ctrl1Y, tipX - 6, tipY + 12, tipX, tipY);
        ctx.bezierCurveTo(tipX + 6, tipY + 12, ctrl2X, ctrl2Y, xRight, baseY);

        // Sedikit partikel muncul dari pucuk lidah api
        if (Math.random() < 0.08) {
          spawnEmber(tipX, tipY);
        }
      }

      // Tutup path ke sudut bawah layar
      ctx.lineTo(width + flameWidth, height);
      ctx.lineTo(startX, height);
      ctx.closePath();
      ctx.fill();
    };

    // Loop animasi
    const render = () => {
      burnState.time += 0.04;
      const { progress, time } = burnState;

      ctx.clearRect(0, 0, width, height);

      if (burnState.started && progress > 0) {
        const baseY = getBaseY(progress);

        // 1. UPDATE CLIP-PATH LAYAR HITAM PRELOADER
        // Area di atas kurva dasar api tetap hitam pekat,
        // area di bawahnya terpotong (transparan) sehingga landing page ter-reveal
        const numPoints = 25;
        const step = width / (numPoints - 1);
        let pathString = "polygon(0 0, 100% 0";

        for (let i = numPoints - 1; i >= 0; i--) {
          const x = i * step;
          const wave =
            Math.sin(x * 0.015 + time * 3) * 14 +
            Math.cos(x * 0.035 - time * 2) * 10;
          const y = baseY + wave;
          pathString += `, ${x.toFixed(1)}px ${Math.max(0, y).toFixed(1)}px`;
        }
        pathString += ")";
        curtain.style.clipPath = pathString;

        // 2. GAMBAR 2-TONE STYLIZED 2D FLAMES (HITAM & MERAH FLAME #ff0000)
        // Layer 1: Lidah api 2D merah tua/pekat di belakang untuk kedalaman visual (#990000)
        drawFlameLayer(baseY, time, "#990000", 1.15, 1.8, 56);

        // Layer 2: Lidah api 2D merah murni menyala di depan (#ff0000 - warna tema web)
        drawFlameLayer(baseY, time, "#ff0000", 0.9, 0, 42);

        // 3. PARTIKEL BARA MERAH MINIMALIS (Sangat ringan, 2-tone red dots)
        for (let i = embers.length - 1; i >= 0; i--) {
          const emb = embers[i];
          emb.x += emb.vx + Math.sin(time * 3 + emb.y * 0.05) * 0.5;
          emb.y += emb.vy;
          emb.alpha -= emb.decay;

          if (emb.alpha <= 0 || emb.y < -30) {
            embers.splice(i, 1);
            continue;
          }

          ctx.fillStyle = "#ff0000";
          ctx.globalAlpha = Math.max(0, emb.alpha);
          ctx.beginPath();
          ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Trigger reveal konten landing page saat api mencapai ~25%
        if (progress >= 0.22 && !burnTriggered) {
          burnTriggered = true;
          onBurnStart?.();
        }
      }

      if (!isDone) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    // ===== GSAP TIMELINE PRELOADER =====
    const tl = gsap.timeline();

    // 1. Logo terisi warna merah dari bawah ke atas
    if (fillLogo) {
      tl.fromTo(
        fillLogo,
        { clipPath: "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.4,
          ease: "power2.inOut",
        }
      );
    }

    // Jeda sejenak setelah logo penuh merah
    tl.to({}, { duration: 0.15 });

    // 2. Api 2D Merah menyala dan membakar layar dari bawah ke atas
    tl.to(burnState, {
      progress: 1,
      duration: 1.75,
      ease: "power2.inOut",
      onStart: () => {
        burnState.started = true;
      },
      onComplete: () => {
        setTimeout(() => {
          onComplete?.();
          setIsDone(true);
        }, 150);
      },
    });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      tl.kill();
    };
  }, [onBurnStart, onComplete, isDone]);

  if (isDone) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden"
    >
      {/* 
        Layar Hitam Preloader (Hitam pekat 2-tone):
        Dipangkas (clip-path) oleh barisan lidah api 2D merah dari bawah ke atas
      */}
      <div
        ref={curtainRef}
        className="absolute inset-0 h-full w-full bg-black flex items-center justify-center will-change-[clip-path]"
      >
        {/* Logo di Tengah Layar Preloader (Putih terisi Merah) */}
        <div className="relative w-[min(38vw,420px)] min-w-[220px] aspect-[1217/431]">
          {/* Logo Putih */}
          <div
            className="absolute inset-0 h-full w-full bg-white opacity-80"
            style={{
              maskImage: "url('/logo.svg')",
              WebkitMaskImage: "url('/logo.svg')",
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />

          {/* Logo Merah Flame (#ff0000) */}
          <div
            ref={fillLogoRef}
            className="absolute inset-0 h-full w-full bg-flame drop-shadow-[0_0_24px_rgba(255,0,0,0.65)]"
            style={{
              maskImage: "url('/logo.svg')",
              WebkitMaskImage: "url('/logo.svg')",
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
              clipPath: "inset(100% 0% 0% 0%)",
            }}
          />
        </div>
      </div>

      {/* Canvas Lidah Api 2D Stylized & Partikel Merah Minimalis */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
    </div>
  );
}
