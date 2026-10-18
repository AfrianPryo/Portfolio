"use client";

import { useEffect, useRef } from "react";
import { createFlameFluid } from "@/lib/flameFluid";

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
    let fluid: ReturnType<typeof createFlameFluid> = null;

    const start = () => {
      if (fluid || !mq.matches) return;
      fluid = createFlameFluid(canvas);
    };
    const stop = () => {
      fluid?.dispose();
      fluid = null;
    };
    const onChange = () => (mq.matches ? start() : stop());

    start();
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      stop();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] h-svh w-screen"
    />
  );
}
