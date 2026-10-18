"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scroll global (Lenis) yang berbagi satu "detak" dengan GSAP:
 * - tidak ada requestAnimationFrame kedua, Lenis ikut gsap.ticker
 * - ScrollTrigger diupdate tiap Lenis scroll, jadi animasi scrub tetap sinkron
 * Dimatikan untuk pengguna yang memilih prefers-reduced-motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.5,
      anchors: true, // link #tentang dst. ikut di-scroll halus
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000); // gsap: detik -> Lenis: ms
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0); // cegah lonjakan saat tab sempat melambat

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33); // kembalikan default GSAP
      lenis.destroy();
    };
  }, []);

  return null;
}