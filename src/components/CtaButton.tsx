import ScrambleText from "./ScrambleText";

/**
 * CTA dua blok datar berdampingan: [ label ] [ + ].
 * Hover: blok berubah ke warna ink, ikon plus berputar.
 *
 * - Default: menempel absolut di kanan bawah hero (data-nav + data-reveal
 *   ikut intro GSAP dari Hero.tsx).
 * - `inline`: mengalir di dalam konten (dipakai di halaman resume).
 */
export default function CtaButton({
  href = "#contact",
  label = "Wujudkan idemu",
  inline = false,
  download,
}: {
  href?: string;
  label?: string;
  inline?: boolean;
  download?: string;
}) {
  const block =
    "bg-flame text-white transition-colors duration-300 ease-out group-hover:bg-ink group-focus-visible:bg-ink";

  const position = inline
    ? "relative inline-flex"
    : "absolute bottom-[clamp(16px,2.4vw,40px)] right-[1.8vw] z-20 flex max-sm:right-3";

  return (
    <a
      href={href}
      download={download}
      {...(inline ? {} : { "data-nav": true, "data-reveal": true })}
      style={{ fontFamily: "'AcerokMages', serif" }}
      className={`group ${position} h-[clamp(34px,3.1vw,48px)] items-stretch gap-[2px] font-acerok text-[clamp(11px,0.9vw,14px)] font-normal uppercase leading-none tracking-normal focus-visible:outline-none`}
    >
      <span
        style={{ fontFamily: "'AcerokMages', serif" }}
        className={`flex items-center whitespace-nowrap px-[1.6em] font-normal ${block}`}
      >
        <ScrambleText text={label} className="tracking-normal" />
      </span>

      <span
        aria-hidden
        className={`relative grid aspect-square h-full place-items-center overflow-hidden ${block}`}
      >
        <PlusIcon className="transition-transform duration-[0.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90 group-focus-visible:rotate-90" />
      </span>
    </a>
  );
}

/* Memakai /public/icon-custom/Plus.svg sebagai mask, warnanya mengikuti currentColor */
function PlusIcon({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block h-[1.3em] w-[1.3em] bg-current ${className ?? ""}`}
      style={{
        WebkitMaskImage: "url('/icon-custom/Plus.svg')",
        maskImage: "url('/icon-custom/Plus.svg')",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}