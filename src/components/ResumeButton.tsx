"use client";

import { useRef, useState } from "react";

const NUM_STRIPS = 9;

// Konfigurasi kurva silinder ultra-halus (gradual 9-strip arc)
const STRIP_CONFIGS = [
  { rotY: -9.5, z: -3.8, shadow: "rgba(0,0,0,0.26)" },
  { rotY: -7.0, z: -2.0, shadow: "rgba(0,0,0,0.14)" },
  { rotY: -4.5, z: -0.4, shadow: "rgba(0,0,0,0.06)" },
  { rotY: -2.0, z: 1.8,  shadow: "rgba(255,255,255,0.04)" },
  { rotY:  0.0, z: 3.2,  shadow: "rgba(255,255,255,0.08)" },
  { rotY:  2.0, z: 1.8,  shadow: "rgba(255,255,255,0.04)" },
  { rotY:  4.5, z: -0.4, shadow: "rgba(0,0,0,0.06)" },
  { rotY:  7.0, z: -2.0, shadow: "rgba(0,0,0,0.14)" },
  { rotY:  9.5, z: -3.8, shadow: "rgba(0,0,0,0.26)" },
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

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    setTilt({
      rotX: -normY * 6,
      rotY: normX * 8,
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
      className="group absolute bottom-[clamp(16px,2.4vw,40px)] left-[1.8vw] z-20 block w-[clamp(160px,14.5vw,225px)] select-none focus-visible:outline-none max-sm:left-3 max-sm:w-[clamp(145px,42vw,190px)]"
      style={{ perspective: "1000px" }}
    >
      <div
        ref={cardRef}
        className="relative w-full aspect-[639/267] transition-all duration-600 ease-[cubic-bezier(0.2,0.9,0.25,1)] [transform-style:preserve-3d]"
        style={{
          // Tiket miring sedikit secara default (-3.8deg) dan responsif lembut saat di-hover
          transform: isHovered
            ? `translateY(-6px) rotateX(${tilt.rotX * 0.7 + 2}deg) rotateY(${tilt.rotY * 0.7}deg) rotateZ(${tilt.rotY * 0.1 - 2.8}deg) scale(1.03)`
            : "translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(-3.8deg) scale(1)",
        }}
      >
        {/* Shadow di bawah tiket yang menyesuaikan sudut miring dan efek melengkung saat terangkat */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 -bottom-3 h-5 rounded-full blur-md transition-all duration-600 ease-out"
          style={{
            background: isHovered
              ? "radial-gradient(ellipse at center, rgba(220,38,38,0.4) 0%, rgba(0,0,0,0.85) 60%, transparent 100%)"
              : "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, transparent 80%)",
            transform: isHovered
              ? "scale(1.1) translateY(4px) rotate(1.5deg)"
              : "scale(0.9) translateY(0px) rotate(-3.8deg)",
            opacity: isHovered ? 1 : 0.65,
          }}
        />

        {/* 
          Container 9 Strip 3D Bending (Melengkung Silindris Halus):
          Memotong gambar tiket menjadi 9 segmen vertikal berdampingan.
        */}
        <div className="relative flex h-full w-full [transform-style:preserve-3d]">
          {STRIP_CONFIGS.map((config, i) => {
            const rotY = isHovered ? config.rotY : 0;
            const z = isHovered ? config.z : 0;

            return (
              <div
                key={i}
                className="relative h-full overflow-hidden [transform-style:preserve-3d] transition-transform duration-600 ease-[cubic-bezier(0.2,0.9,0.25,1)]"
                style={{
                  width: `calc(100% / ${NUM_STRIPS} + 0.5px)`,
                  marginRight: i === NUM_STRIPS - 1 ? 0 : "-0.5px",
                  transform: `rotateY(${rotY}deg) translateZ(${z}px)`,
                  transformOrigin: i < 4 ? "right center" : i > 4 ? "left center" : "center center",
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

                {/* Shading silinder melengkung yang sangat halus */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 transition-opacity duration-600"
                  style={{
                    opacity: isHovered ? 1 : 0,
                    backgroundColor: config.shadow,
                    mixBlendMode: i >= 3 && i <= 5 ? "soft-light" : "multiply",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 
          MASKED HIGHLIGHT KILAUAN PERSIS SESUAI BENTUK TIKET:
          Menggunakan CSS mask-image: url('/resume-ticket.png').
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden transition-all duration-600"
          style={{
            WebkitMaskImage: "url('/resume-ticket.png')",
            maskImage: "url('/resume-ticket.png')",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            transform: isHovered ? "translateZ(10px)" : "translateZ(1px)",
            opacity: isHovered ? 1 : 0,
          }}
        >
          {/* 1. Berkas sinar kilau diagonal menyapu */}
          <div
            className="absolute -inset-full w-[250%] h-[250%] transition-transform duration-1000 ease-out"
            style={{
              background:
                "linear-gradient(115deg, transparent 38%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.25) 55%, transparent 62%)",
              transform: isHovered
                ? "translateX(65%) translateY(15%)"
                : "translateX(-65%) translateY(-15%)",
              mixBlendMode: "screen",
            }}
          />

          {/* 2. Interactive Specular Sheen */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 95px at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,0.45) 0%, rgba(255,200,200,0.18) 50%, transparent 80%)`,
              mixBlendMode: "screen",
            }}
          />

          {/* 3. Cylindrical Crest Highlight */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 28%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.12) 52%, transparent 72%)",
              mixBlendMode: "screen",
            }}
          />

          {/* 4. Subtle Rim Tint */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 110% 90% at 50% 50%, transparent 68%, rgba(255,50,50,0.28) 100%)",
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>
    </a>
  );
}
