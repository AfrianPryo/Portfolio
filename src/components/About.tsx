"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Section About — teks manifesto besar di tengah,
 * kata-kata kunci di-highlight merah (flame),
 * teks reveal per-baris saat scroll.
 * Aset 3D ornamen berpisah menjadi 3 bagian di atas section ini (di-drive dari ornamentscene.tsx).
 */
export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-about-line]", { autoAlpha: 1, yPercent: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ===== Reveal teks per baris saat scroll =====
        const lines = gsap.utils.toArray<HTMLElement>("[data-about-line]");
        lines.forEach((line) => {
          gsap.set(line, { autoAlpha: 0, yPercent: 80 });
          gsap.to(line, {
            autoAlpha: 1,
            yPercent: 0,
            duration: 1.2,
            ease: "power4.out",
            scrollTrigger: {
              trigger: line,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      id="tentang"
      className="relative overflow-hidden bg-black py-[clamp(120px,18vw,260px)]"
    >
      <div className="relative z-20 mx-auto max-w-[960px] px-[4vw]">
        {/* Teks manifesto tengah */}
        <blockquote className="text-center font-display text-[clamp(28px,5.2vw,82px)] uppercase leading-[0.92] tracking-[-0.03em] text-white">
          <span data-about-line className="block py-[0.05em]">
            Saya percaya bahwa
          </span>
          <span data-about-line className="block py-[0.05em]">
            <span className="text-flame">ide terbaik</span> lahir
          </span>
          <span data-about-line className="block py-[0.05em]">
            dari eksekusi yang
          </span>
          <span data-about-line className="block py-[0.05em]">
            presisi. Setiap detail
          </span>
          <span data-about-line className="block py-[0.05em]">
            adalah peluang, setiap
          </span>
          <span data-about-line className="block py-[0.05em]">
            proses adalah langkah
          </span>
          <span data-about-line className="block py-[0.05em]">
            untuk menjadi{" "}
            <span className="text-flame">lebih tajam,</span>
          </span>
          <span data-about-line className="block py-[0.05em]">
            <span className="text-flame">lebih fokus, lebih utuh.</span>
          </span>
        </blockquote>
      </div>
    </section>
  );
}
