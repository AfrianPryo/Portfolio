"use client";

import { useEffect, useRef } from "react";

/**
 * Teks yang "diacak jadi angka" saat induk <a>-nya di-hover / di-fokus,
 * lalu menyusun diri kembali huruf demi huruf dari kiri ke kanan.
 * - langsung mengubah DOM (tanpa state React) jadi ringan
 * - lebar tiap karakter dikunci selama animasi → tidak ada layout shift
 *   (tidak perlu font mono) sehingga bracket di sekitarnya tidak bergetar
 * - screen reader tetap membaca teks asli (aria-label)
 * - dimatikan untuk prefers-reduced-motion
 */
export default function ScrambleText({
  text,
  duration = 420, // ms total sampai semua huruf kembali
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

    const chars = [...text];
    let raf = 0;
    let spans: HTMLSpanElement[] = [];
    const digit = () => String(Math.floor(Math.random() * 10));
    const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

    const reset = () => {
      el.textContent = text;
      spans = [];
    };

    // Bungkus tiap karakter dalam slot dengan lebar tetap (diukur dari huruf asli).
    const build = () => {
      el.textContent = text;
      const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
      const widths = chars.map((c) => {
        const probe = document.createElement("span");
        probe.style.whiteSpace = "pre";
        probe.textContent = c;
        el.appendChild(probe);
        const w = probe.getBoundingClientRect().width;
        el.removeChild(probe);
        return w / fontSize;
      });

      el.textContent = "";
      spans = chars.map((c, i) => {
        const s = document.createElement("span");
        s.style.display = "inline-block";
        s.style.whiteSpace = "pre";
        s.style.textAlign = "center";
        s.style.width = `${widths[i]}em`;
        s.textContent = c;
        el.appendChild(s);
        return s;
      });
    };

    const run = () => {
      cancelAnimationFrame(raf);
      build();

      const start = performance.now();
      let lastSwap = 0;

      const frame = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // ganti angka acak tiap ~35ms supaya terbaca, bukan berkedip tiap frame
        if (now - lastSwap > 35 || t === 1) {
          lastSwap = now;
          const solved = Math.floor(easeOut(t) * chars.length);
          spans.forEach((s, i) => {
            const c = chars[i];
            s.textContent = c === " " || i < solved ? c : digit();
          });
        }
        if (t < 1) raf = requestAnimationFrame(frame);
        else reset();
      };
      raf = requestAnimationFrame(frame);
    };

    host.addEventListener("mouseenter", run);
    host.addEventListener("focus", run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("mouseenter", run);
      host.removeEventListener("focus", run);
      reset();
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