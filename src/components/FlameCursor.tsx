"use client";

import { useEffect, useRef } from "react";

// Skala lingkaran: kecil saat di area Works, penuh saat hover proyek.
const RING_IDLE_SCALE = 0.42;
const RING_HOVER_SCALE = 1;
// Putaran flame (derajat/detik): dasar + tambahan mengikuti kecepatan kursor.
const SPIN_BASE = 55;
const SPIN_BOOST = 0.09;
const SPIN_MAX = 520;

/**
 * Overlay api liquify global dan cursor ornament khusus section Works.
 * - fixed + pointer-events-none: tidak mengganggu klik/scroll
 * - mix-blend-mode: multiply: api merah menyatu dengan teks/ornamen, teks hitam tetap terbaca
 * - api nonaktif di perangkat sentuh/reduced motion; ornamen hanya di pointer halus
 * - lingkaran mengikuti kursor dengan easing, flame berputar, dan crossfade
 *   halus dari api liquid ke lingkaran saat masuk section Works
 */
export default function FlameCursor() {
  const ref = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLImageElement>(null);
  const viewRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    const flame = flameRef.current;
    const view = viewRef.current;
    if (!canvas || !cursor || !ring || !flame || !view) return;
    const mq = window.matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    const finePointer = window.matchMedia("(pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fluid: ReturnType<
      typeof import("@/lib/flameFluid").createFlameFluid
    > = null;
    let loading = false;
    let initialized = false;
    let disposed = false;
    let pointerX = 0;
    let pointerY = 0;
    let hasPointerPosition = false;
    let scrollFrame: number | null = null;
    // Target terakhir yang sudah diproses: pointermove di elemen yang sama tidak
    // perlu menjalankan closest() lagi (hasilnya pasti sama).
    let lastTarget: Element | null = null;

    // ===== Posisi (easing) & putaran =====
    let curX = 0;
    let curY = 0;
    let angle = 0;
    let spin = SPIN_BASE;
    let lastTime = 0;
    let rafId: number | null = null;
    let hideTimer: number | undefined;
    let cursorVisible = false;

    const tick = (now: number) => {
      rafId = null;
      if (disposed) return;

      const dt = Math.min(now - lastTime || 16, 64);
      lastTime = now;

      const follow = reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 0.018);
      const dx = (pointerX - curX) * follow;
      const dy = (pointerY - curY) * follow;

      curX += dx;
      curY += dy;

      // Kecepatan gerak (px/detik) memperkuat putaran, lalu dihaluskan.
      const speed = (Math.hypot(dx, dy) / dt) * 1000;
      const targetSpin = reduceMotion.matches
        ? 0
        : Math.min(SPIN_BASE + speed * SPIN_BOOST, SPIN_MAX);

      spin += (targetSpin - spin) * (1 - Math.exp(-dt * 0.006));
      angle = (angle + (spin * dt) / 1000) % 360;

      cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
      flame.style.transform = `rotate(${angle}deg)`;

      rafId = window.requestAnimationFrame(tick);
    };
    const startLoop = () => {
      window.clearTimeout(hideTimer);
      if (rafId !== null) return;

      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };
    const stopLoopLater = () => {
      window.clearTimeout(hideTimer);
      // Biarkan loop jalan sampai fade-out selesai.
      hideTimer = window.setTimeout(() => {
        if (rafId !== null) window.cancelAnimationFrame(rafId);
        rafId = null;
      }, 500);
    };

    // ===== Tampilan lingkaran & teks view =====
    const setRing = (scale: number) => {
      ring.style.transform = `scale(${scale})`;
    };
    const setView = (visible: boolean) => {
      if (visible) {
        // Muncul: tunggu lingkaran mulai membesar, lalu fade + sedikit naik.
        view.style.transition =
          "opacity 520ms cubic-bezier(0.22,1,0.36,1) 160ms, transform 620ms cubic-bezier(0.22,1,0.36,1) 160ms, filter 520ms ease-out 160ms";
        view.style.opacity = "1";
        view.style.transform = "translateY(0) scale(1)";
        view.style.filter = "blur(0px)";
      } else {
        // Hilang: lebih cepat, tanpa jeda.
        view.style.transition =
          "opacity 180ms ease-in, transform 220ms ease-in, filter 180ms ease-in";
        view.style.opacity = "0";
        view.style.transform = "translateY(4px) scale(0.88)";
        view.style.filter = "blur(3px)";
      }
    };
    const hideCursor = () => {
      cursorVisible = false;
      cursor.style.opacity = "0";
      setRing(0);
      setView(false);
      stopLoopLater();
    };

    const start = async () => {
      if (fluid || loading || initialized || disposed || !mq.matches) return;

      loading = true;
      initialized = true;
      try {
        const { createFlameFluid } = await import("@/lib/flameFluid");
        if (!disposed && mq.matches) fluid = createFlameFluid(canvas);
      } catch (error) {
        console.error("[FlameCursor] Gagal memuat simulasi fluida.", error);
      } finally {
        loading = false;
      }
    };
    const stop = () => {
      fluid?.dispose();
      fluid = null;
    };
    const updateCursor = (target: Element | null) => {
      const isOverWorks = Boolean(target?.closest("#works"));
      const isOverProject = Boolean(target?.closest("[data-works-project]"));
      const showCursor = finePointer.matches && isOverWorks;

      canvas.style.opacity = isOverWorks ? "0" : "1";

      if (!showCursor) {
        if (cursorVisible) hideCursor();
        return;
      }

      if (!cursorVisible) {
        // Pertama kali muncul: mulai dari posisi kursor (tidak meluncur dari
        // pojok), lalu tumbuh halus dari titik kecil.
        cursorVisible = true;
        curX = pointerX;
        curY = pointerY;
        cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
        cursor.style.opacity = "1";
        startLoop();
      }

      setRing(isOverProject ? RING_HOVER_SCALE : RING_IDLE_SCALE);
      setView(isOverProject);
    };
    const handlePointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      hasPointerPosition = true;
      const target = e.target instanceof Element ? e.target : null;
      if (target !== lastTarget) {
        lastTarget = target;
        updateCursor(target);
      }
      if (mq.matches) void start();
    };
    const handleScroll = () => {
      if (!hasPointerPosition || scrollFrame !== null) return;

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = null;
        const target = document.elementFromPoint(pointerX, pointerY);
        lastTarget = target;
        updateCursor(target);
      });
    };
    const handlePointerOut = (e: PointerEvent) => {
      if (e.relatedTarget !== null) return;

      hasPointerPosition = false;
      lastTarget = null;
      canvas.style.opacity = "1";
      hideCursor();
    };
    const onChange = () => {
      if (!mq.matches) {
        stop();
        initialized = false;
      }
    };

    // Keadaan awal lingkaran: tersembunyi & kecil.
    setRing(0);
    setView(false);

    mq.addEventListener("change", onChange);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      disposed = true;
      mq.removeEventListener("change", onChange);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("scroll", handleScroll);
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.clearTimeout(hideTimer);
      stop();
    };
  }, []);

  return (
    <>
      <canvas
        ref={ref}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[60] h-svh w-screen transition-opacity duration-500 ease-out"
      />
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[100] opacity-0 will-change-transform"
        style={{ transition: "opacity 300ms ease-out" }}
      >
        {/* Wrapper skala: kecil saat idle di Works, membesar saat hover proyek. */}
        <div
          ref={ringRef}
          className="relative will-change-transform"
          style={{
            transform: "scale(0)",
            transition: "transform 650ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={flameRef}
            src="/cursorFollowing.svg"
            alt=""
            width={135}
            height={136}
            draggable={false}
            className="block h-[clamp(72px,9vw,108px)] w-[clamp(72px,9vw,108px)] select-none will-change-transform"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={viewRef}
              src="/view-text.png"
              alt=""
              width={180}
              height={101}
              draggable={false}
              className="pointer-events-none block w-[clamp(38px,4.5vw,54px)] max-w-none select-none will-change-transform"
              style={{
                opacity: 0,
                transform: "translateY(4px) scale(0.88)",
                filter: "blur(3px)",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}