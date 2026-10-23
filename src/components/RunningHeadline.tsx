"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function RunningHeadline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const text = textRef.current;
    const container = containerRef.current;
    if (!text || !container) return;

    const heroSection =
      container.closest("section") || container.parentElement || container;

    // Batas pergeseran subtle yang terukur dan rapi
    // minX: batas henti ke kiri (saat scroll ke bawah)
    // maxX: batas henti ke kanan (saat scroll ke atas)
    let minX = -Math.min(window.innerWidth * 0.16, 210);
    let maxX = Math.min(window.innerWidth * 0.16, 210);

    const updateBounds = () => {
      minX = -Math.min(window.innerWidth * 0.16, 210);
      maxX = Math.min(window.innerWidth * 0.16, 210);
    };
    window.addEventListener("resize", updateBounds);

    let currentX = 0;
    let targetX = 0;
    let wheelOffset = 0;

    // 1. ScrollTrigger saat halaman discroll vertikal
    const st = ScrollTrigger.create({
      trigger: heroSection,
      start: "top top",
      end: "bottom top",
      onUpdate: (self) => {
        // self.progress: 0 (paling atas) -> 1 (masuk section about)
        const scrollShift = self.progress * minX;
        const combined = scrollShift + wheelOffset;
        targetX = Math.max(minX, Math.min(maxX, combined));
      },
    });

    // 2. Wheel event: tetap menggeser teks ke kanan saat user terus scroll ke atas
    // meskipun viewport sudah berada di posisi paling atas (scrollY <= 2)
    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      // Scroll ke atas (delta < 0) -> geser ke kanan (nilai positif)
      // Scroll ke bawah (delta > 0) -> geser ke kiri (nilai negatif)
      wheelOffset -= delta * 0.65;
      wheelOffset = Math.max(minX, Math.min(maxX, wheelOffset));

      const isAtTop = window.scrollY <= 4;
      if (isAtTop) {
        // Saat di paling atas: terus bergeser sampai batas maxX lalu berhenti pas
        targetX = Math.max(minX, Math.min(maxX, wheelOffset));
      } else {
        const scrollShift = st.progress * minX;
        targetX = Math.max(minX, Math.min(maxX, scrollShift + wheelOffset * 0.25));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });

    // 3. Smooth Damping Ticker: lerp sangat halus, empuk, dan subtle
    const tick = () => {
      currentX += (targetX - currentX) * 0.055;
      text.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0)`;
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    });
    visibilityObserver.observe(container);

    // 4. Parallax kursor halus
    const mm = gsap.matchMedia();
    mm.add("(pointer: fine)", () => {
      const quickOffset = gsap.quickTo(container, "x", {
        duration: 1.4,
        ease: "power3.out",
      });
      const onPointerMove = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        quickOffset(nx * -20);
      };
      window.addEventListener("pointermove", onPointerMove);
      return () => window.removeEventListener("pointermove", onPointerMove);
    });

    return () => {
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("wheel", handleWheel);
      st.kill();
      visibilityObserver.disconnect();
      gsap.ticker.remove(tick);
      mm.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-label="Ideas into Reality"
      data-reveal
      data-heading
      className="pointer-events-none absolute inset-x-0 top-[44%] z-[2] -translate-y-1/2 flex items-center justify-center select-none"
    >
      <h1
        ref={textRef}
        className="whitespace-nowrap font-switzer text-[clamp(68px,12vw,185px)] font-normal uppercase tracking-tight leading-none text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.55)] will-change-transform"
      >
        IDEAS INTO REALITY
      </h1>
    </div>
  );
}
