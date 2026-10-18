"use client";

import { useEffect, useRef } from "react";

/**
 * Teks yang "diacak jadi angka" saat induk <a>-nya di-hover / di-fokus,
 * lalu menyusun diri kembali huruf demi huruf dari kiri ke kanan.
 * - langsung mengubah textContent (tanpa state React) jadi ringan
 * - font mono → lebar tidak berubah, tidak ada layout shift
 * - screen reader tetap membaca teks asli (aria-label)
 * - dimatikan untuk prefers-reduced-motion
 */
export default function ScrambleText({
  text,
  duration = 650, // ms total sampai semua huruf kembali
  className,
}: {
  text: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.closest("a");
    if (!el || !host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const digit = () => String(Math.floor(Math.random() * 10));

    const run = () => {
      cancelAnimationFrame(raf);
      const start = performance.now();
      let lastSwap = 0;
      const chars = [...text];

      const frame = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // ganti angka acak tiap ~40ms supaya terbaca, bukan berkedip tiap frame
        if (now - lastSwap > 40 || t === 1) {
          lastSwap = now;
          const solved = Math.floor(t * chars.length);
          el.textContent = chars
            .map((c, i) => (c === " " || i < solved ? c : digit()))
            .join("");
        }
        if (t < 1) raf = requestAnimationFrame(frame);
        else el.textContent = text;
      };
      raf = requestAnimationFrame(frame);
    };

    host.addEventListener("mouseenter", run);
    host.addEventListener("focus", run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("mouseenter", run);
      host.removeEventListener("focus", run);
      el.textContent = text;
    };
  }, [text, duration]);

  return (
    <span aria-label={text} className={className}>
      <span ref={ref} aria-hidden>
        {text}
      </span>
    </span>
  );
}