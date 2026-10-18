"use client";

import { useRef, useState } from "react";

const NUM_STRIPS = 7;

// Konfigurasi kurva silinder untuk efek bending (melengkung)
const STRIP_CONFIGS = [
  { rotY: -17, z: -7, shadow: "rgba(0,0,0,0.35)" },
  { rotY: -11, z: -2, shadow: "rgba(0,0,0,0.15)" },
  { rotY: -5, z: 3, shadow: "rgba(255,255,255,0.06)" },
  { rotY: 0, z: 6, shadow: "rgba(255,255,255,0.12)" },
  { rotY: 5, z: 3, shadow: "rgba(255,255,255,0.06)" },
  { rotY: 11, z: -2, shadow: "rgba(0,0,0,0.15)" },
  { rotY: 17, z: -7, shadow: "rgba(0,0,0,0.35)" },
];

export default function ResumeButton({
  href = "/resume.pdf",
}: {
  href?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0, shineX: 50, shineY: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalisasi -1 s/d 1
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    setTilt({
      rotX: -normY * 8,
      rotY: normX * 10,
      shineX: (x / rect.width) * 100,
      shineY: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotX: 0, rotY: 0, shineX: 50, shineY: 50 });
  };

  return (
    <a
      href={href}
      download="Afrian-Resume.pdf"
      target="_blank"
      rel="noopener noreferrer"
      data-nav
      data-reveal
      aria-label="Unduh Resume"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group absolute bottom-[clamp(16px,2.4vw,40px)] left-[1.8vw] z-20 block w-[clamp(180px,16.5vw,255px)] select-none focus-visible:outline-none max-sm:left-3 max-sm:w-[clamp(165px,46vw,210px)]"
      style={{ perspective: "1000px" }}
    >
      <div
        ref={cardRef}
        className="relative w-full aspect-[639/267] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] [transform-style:preserve-3d]"
        style={{
          // Tiket miring sedikit secara default (-3.8deg) dan merespons kursor saat di-hover
          transform: isHovered
            ? `translateY(-9px) rotateX(${tilt.rotX + 3}deg) rotateY(${tilt.rotY}deg) rotateZ(${tilt.rotY * 0.15 - 2.8}deg) scale(1.05)`
            : "translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(-3.8deg) scale(1)",
        }}
      >
        {/* Shadow di bawah tiket yang menyesuaikan sudut miring dan efek melengkung saat terangkat */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 -bottom-3.5 h-6 rounded-full blur-md transition-all duration-500 ease-out"
          style={{
            background: isHovered
              ? "radial-gradient(ellipse at center, rgba(220,38,38,0.45) 0%, rgba(0,0,0,0.85) 60%, transparent 100%)"
              : "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, transparent 80%)",
            transform: isHovered
              ? "scale(1.15) translateY(6px) rotate(2deg)"
              : "scale(0.9) translateY(0px) rotate(-3.8deg)",
            opacity: isHovered ? 1 : 0.65,
          }}
        />

        {/* 
          Container 7 Strip 3D Bending (Melengkung Silindris):
          Memotong gambar tiket menjadi 7 segmen vertikal berdampingan.
          Saat di-hover, segmen berotasi membentuk busur silinder cembung (curved arch),
          sehingga tiket melengkung secara fisik di ruang 3D.
        */}
        <div className="relative flex h-full w-full [transform-style:preserve-3d]">
          {STRIP_CONFIGS.map((config, i) => {
            const rotY = isHovered ? config.rotY : 0;
            const z = isHovered ? config.z : 0;

            return (
              <div
                key={i}
                className="relative h-full overflow-hidden [transform-style:preserve-3d] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  width: `calc(100% / ${NUM_STRIPS} + 0.5px)`,
                  marginRight: i === NUM_STRIPS - 1 ? 0 : "-0.5px",
                  transform: `rotateY(${rotY}deg) translateZ(${z}px)`,
                  transformOrigin: i < 3 ? "right center" : i > 3 ? "left center" : "center center",
                }}
              >
                {/* Potongan gambar tiket */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/resume-ticket.png"
                  alt="Download Resume"
                  draggable={false}
                  className="pointer-events-none absolute top-0 max-w-none select-none"
                  style={{
                    width: `${NUM_STRIPS * 100}%`,
                    height: "100%",
                    left: `-${i * 100}%`,
                  }}
                />

                {/* Shading silinder melengkung (sisi samping lebih gelap, tengah lebih terang) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    backgroundColor: config.shadow,
                    mixBlendMode: i === 2 || i === 3 || i === 4 ? "soft-light" : "multiply",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 
          MASKED HIGHLIGHT KILAUAN PERSIS SESUAI BENTUK TIKET:
          Menggunakan CSS mask-image: url('/resume-ticket.png').
          Dengan ini, semua kilauan sinar, kilau sweep diagonal, dan ambient sheen
          100% terpotong presisi mengikuti siluet tiket (termasuk 4 lengkungan notch di sudut).
          
          PENTING: Diberi translateZ(14px) agar selalu berada DI ATAS semua segmen strip 3D
          sehingga tidak tertimpa / ter-clipping oleh elemen bagian tengah saat melengkung!
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden transition-all duration-500"
          style={{
            WebkitMaskImage: "url('/resume-ticket.png')",
            maskImage: "url('/resume-ticket.png')",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            transform: isHovered ? "translateZ(14px)" : "translateZ(1px)",
            opacity: isHovered ? 1 : 0,
          }}
        >
          {/* 1. Berkas sinar kilau diagonal menyapu (Sweeping Ray of Light) */}
          <div
            className="absolute -inset-full w-[250%] h-[250%] transition-transform duration-1000 ease-out"
            style={{
              background:
                "linear-gradient(115deg, transparent 36%, rgba(255,255,255,0.3) 44%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.3) 56%, transparent 64%)",
              transform: isHovered
                ? "translateX(65%) translateY(15%)"
                : "translateX(-65%) translateY(-15%)",
              mixBlendMode: "screen",
            }}
          />

          {/* 2. Interactive Specular Sheen (Kilauan mengikuti pergerakan kursor mouse) */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 105px at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.5) 0%, rgba(255,200,200,0.22) 50%, transparent 80%)`,
              mixBlendMode: "screen",
            }}
          />

          {/* 3. Cylindrical Crest Highlight (Kilauan garis lengkungan di puncak cembung tiket) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.14) 48%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.14) 52%, transparent 76%)",
              mixBlendMode: "screen",
            }}
          />

          {/* 4. Subtle Rim Tint (Glow aksen merah terang di sepanjang tepi tiket) */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 110% 90% at 50% 50%, transparent 60%, rgba(255,50,50,0.35) 100%)",
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>
    </a>
  );
}
