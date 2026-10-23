"use client";

import { useEffect, useRef } from "react";

/**
 * Overlay liquify api merah yang mengikuti kursor.
 * - fixed + pointer-events-none: tidak mengganggu klik/scroll
 * - mix-blend-mode: multiply: api merah menyatu dengan teks/ornamen, teks hitam tetap terbaca
 * - nonaktif di perangkat sentuh dan saat prefers-reduced-motion
 */
export default function FlameCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const mq = window.matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)"
    );
    let fluid: ReturnType<
      typeof import("@/lib/flameFluid").createFlameFluid
    > = null;
    let loading = false;
    let initialized = false;
    let disposed = false;

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
    const handlePointerMove = (e: PointerEvent) => {
      const isOverWorks = Boolean((e.target as Element | null)?.closest("#works"));
      canvas.style.opacity = isOverWorks ? "0" : "1";
      if (mq.matches) void start();
    };
    const onChange = () => {
      if (!mq.matches) {
        stop();
        initialized = false;
      }
    };

    mq.addEventListener("change", onChange);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      disposed = true;
      mq.removeEventListener("change", onChange);
      window.removeEventListener("pointermove", handlePointerMove);
      stop();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] h-svh w-screen transition-opacity duration-300"
    />
  );
}
