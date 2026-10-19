"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// 10 kotak putih kosong sesuai sketsa referensi
const CARDS = Array.from({ length: 10 }, (_, i) => ({ id: `card-${i + 1}` }));

export default function Works() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const clipRefs = useRef<(SVGPathElement | null)[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorIconRef = useRef<HTMLImageElement>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(track, { x: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // =========================================================================
        // 1. TRANSISI PARALLAX OVERLAP ANTARA ABOUT DAN WORKS:
        // - 35% pertama: About diam di posisinya (sticky), Works naik menutupi 35% (sepertiga)
        //   bagian bawah About dengan efek parallax layer dan bayangan z-axis.
        // - 65% selebihnya: About bergerak naik bersamaan (-window.innerHeight * 0.65)
        //   sehingga keduanya lanjut scroll ke atas seperti biasa secara sinkron & mulus.
        // =========================================================================
        const aboutEl = document.querySelector<HTMLElement>("#tentang");
        if (aboutEl) {
          const overlapTl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "top top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });

          overlapTl
            .to(aboutEl, { y: 0, duration: 0.35, ease: "none" })
            .to(aboutEl, {
              y: () => -window.innerHeight * 0.65,
              filter: "brightness(0.4)",
              duration: 0.65,
              ease: "none",
            });
        }

        // =========================================================================
        // 2. HORIZONTAL CAROUSEL PIN & SCRUB:
        // Saat Works menutupi layar penuh, section mengunci (pin: true)
        // dan pergerakan scroll menggeser carousel horizontal.
        // =========================================================================
        const getScrollDistance = () => {
          return -(track.scrollWidth - window.innerWidth + window.innerWidth * 0.08);
        };

        const carouselTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.max(track.scrollWidth - window.innerWidth, window.innerHeight * 1.5)}`,
            pin: true,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });

        carouselTl.to(track, {
          x: getScrollDistance,
          ease: "none",
        });

        // =========================================================================
        // 3. EFEK PINCUSHION DISTORTION DINAMIS (DITINGKATKAN):
        // Kartu melengkung (bend) menyesuaikan kurva pincushion perspective dengan
        // distorsi yang lebih tegas dan dramatis.
        // =========================================================================
        const updatePincushion = () => {
          const cards = cardsRef.current;
          const vw = window.innerWidth;
          const cx = vw / 2;
          const halfVw = vw / 2;

          for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (!card) continue;
            const rect = card.getBoundingClientRect();
            // Abaikan kartu yang berada jauh di luar layar untuk efisiensi
            if (rect.right < -vw * 0.5 || rect.left > vw * 1.5) continue;

            const cardCX = rect.left + rect.width / 2;
            const nx = (cardCX - cx) / halfVw;
            const absX = Math.abs(nx);

            // 1. Orientasi 3D halus & elegan
            const rotY = -Math.sign(nx) * Math.pow(absX, 1.2) * 11;
            const tz = (Math.pow(absX, 1.5) - 0.25) * 32;
            const scale = 1 + Math.pow(absX, 2) * 0.04;

            card.style.transform = `translate3d(0, 0px, ${tz}px) rotateY(${rotY}deg) scale(${scale})`;

            // 2. Geometri kelengkungan kurva global (Persis sesuai garis hijau referensi):
            // Garis kurva hijau adalah lengkungan global kontinu di seluruh layar:
            // - Di tengah layar (center): sisi atas mencelup lembut ke bawah, sisi bawah melengkung lembut ke atas (pinggang ramping)
            // - Ke arah tepi kiri dan kanan layar: kurva mengembang lembut ke atas (top) dan ke bawah (bottom)
            // - Sisi kiri dan kanan kartu tetap tegak lurus (garis vertikal bersih, tanpa benjolan barel)
            const nxL = (rect.left - cx) / halfVw;
            const nxR = (rect.right - cx) / halfVw;
            const nxM = nx;

            // Fungsi kurva global hijau: flare kontinu halus
            const getCurveHalfHeight = (u: number) => {
              const uClamped = Math.min(1.35, Math.abs(u));
              // Setengah tinggi nominal di tengah = 195 (tinggi total 390)
              // Mengembang secara eksponensial lembut (1.7) hingga +110 di tepi layar (tinggi total 610)
              return 195 + Math.pow(uClamped, 1.7) * 110;
            };

            const hL = getCurveHalfHeight(nxL);
            const hR = getCurveHalfHeight(nxR);
            const hM = getCurveHalfHeight(nxM);

            const yT0 = 312.5 - hL;
            const yT1 = 312.5 - hR;
            const yTM = 312.5 - hM;
            const yTc = 2 * yTM - 0.5 * (yT0 + yT1);

            const yB0 = 312.5 + hL;
            const yB1 = 312.5 + hR;
            const yBM = 312.5 + hM;
            const yBc = 2 * yBM - 0.5 * (yB0 + yB1);

            // Sisi kiri & kanan adalah garis vertikal tegak lurus bersih (clean straight vertical edges)
            const pathData = `M 0,${yT0.toFixed(1)} Q 500,${yTc.toFixed(1)} 1000,${yT1.toFixed(1)} L 1000,${yB1.toFixed(1)} Q 500,${yBc.toFixed(1)} 0,${yB0.toFixed(1)} Z`;

            const pathEl = pathRefs.current[i];
            if (pathEl) {
              pathEl.setAttribute("d", pathData);
            }
            const clipEl = clipRefs.current[i];
            if (clipEl) {
              clipEl.setAttribute("d", pathData);
            }
          }
        };

        gsap.ticker.add(updatePincushion);
        updatePincushion();

        // =========================================================================
        // 4. FOLLOWING CURSOR DENGAN ROTASI (KHUSUS SECTION WORKS)
        // =========================================================================
        const cursorEl = cursorRef.current;
        const cursorIcon = cursorIconRef.current;

        let cleanupCursor: (() => void) | undefined;

        if (cursorEl && cursorIcon) {
          gsap.set(cursorEl, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.3 });

          const spinTween = gsap.to(cursorIcon, {
            rotation: 360,
            duration: 8,
            repeat: -1,
            ease: "none",
          });
          spinTweenRef.current = spinTween;

          const xTo = gsap.quickTo(cursorEl, "x", { duration: 0.28, ease: "power3.out" });
          const yTo = gsap.quickTo(cursorEl, "y", { duration: 0.28, ease: "power3.out" });

          const handlePointerMoveCursor = (e: PointerEvent) => {
            xTo(e.clientX);
            yTo(e.clientY);
          };

          const handlePointerEnterCursor = (e: PointerEvent) => {
            xTo(e.clientX);
            yTo(e.clientY);
            gsap.to(cursorEl, {
              opacity: 1,
              scale: 1,
              duration: 0.3,
              ease: "back.out(1.7)",
            });
          };

          const handlePointerLeaveCursor = () => {
            gsap.to(cursorEl, {
              opacity: 0,
              scale: 0.3,
              duration: 0.25,
              ease: "power2.in",
            });
          };

          section.addEventListener("pointermove", handlePointerMoveCursor);
          section.addEventListener("pointerenter", handlePointerEnterCursor);
          section.addEventListener("pointerleave", handlePointerLeaveCursor);

          cleanupCursor = () => {
            section.removeEventListener("pointermove", handlePointerMoveCursor);
            section.removeEventListener("pointerenter", handlePointerEnterCursor);
            section.removeEventListener("pointerleave", handlePointerLeaveCursor);
            spinTween.kill();
          };
        }

        return () => {
          gsap.ticker.remove(updatePincushion);
          cleanupCursor?.();
        };
      });
    },
    { scope: sectionRef }
  );

  // Drag interaktif dengan pointer/mouse untuk menggeser carousel secara intuitif
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (cursorRef.current) {
      gsap.to(cursorRef.current, { scale: 0.85, duration: 0.2 });
    }
    if (spinTweenRef.current) {
      gsap.to(spinTweenRef.current, { timeScale: 2.4, duration: 0.2 });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    startX.current = e.clientX;
    window.scrollBy({ top: -deltaX * 1.5, behavior: "instant" });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (cursorRef.current) {
      gsap.to(cursorRef.current, { scale: 1, duration: 0.25, ease: "back.out(1.5)" });
    }
    if (spinTweenRef.current) {
      gsap.to(spinTweenRef.current, { timeScale: 1, duration: 0.5 });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="works"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative z-40 h-screen w-full rounded-none bg-[#c81010] bg-[radial-gradient(ellipse_at_center,_#d61515_0%,_#b80a0a_70%,_#9e0606_100%)] shadow-[0_-16px_36px_rgba(0,0,0,0.28)] overflow-hidden flex items-center select-none cursor-none [perspective:1600px]"
    >
      {/* Track Carousel Horizontal dengan 3D Preserve */}
      <div
        ref={trackRef}
        className="flex items-center gap-[clamp(20px,2.5vw,42px)] pl-[clamp(24px,5vw,72px)] pr-[clamp(24px,8vw,120px)] will-change-transform [transform-style:preserve-3d]"
      >
        {CARDS.map((card, i) => (
          <div
            key={card.id}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
            className="shrink-0 w-[clamp(240px,26vw,420px)] aspect-[16/10] will-change-transform [transform-style:preserve-3d] [backface-visibility:hidden] relative"
            aria-hidden="true"
          >
            {/* Kartu SVG dengan lengkungan pincushion distortion dinamis */}
            <svg
              viewBox="0 0 1000 625"
              className="w-full h-full overflow-visible drop-shadow-[0_14px_36px_rgba(0,0,0,0.22)]"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`card-grad-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f5f5f7" />
                </linearGradient>
                <clipPath id={`card-clip-${card.id}`}>
                  <path
                    ref={(el) => {
                      clipRefs.current[i] = el;
                    }}
                    d="M 0,117.5 L 1000,117.5 L 1000,507.5 L 0,507.5 Z"
                  />
                </clipPath>
              </defs>
              <path
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                d="M 0,117.5 L 1000,117.5 L 1000,507.5 L 0,507.5 Z"
                fill={`url(#card-grad-${card.id})`}
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Following Cursor dengan SVG berputar khusus section Works */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-[70] hidden select-none will-change-transform [@media(pointer:fine)]:block"
      >
        <img
          ref={cursorIconRef}
          src="/cursorFollowing.svg"
          alt=""
          className="w-[105px] h-[105px] select-none pointer-events-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        />
      </div>
    </section>
  );
}
