import ScrambleText from "./ScrambleText";

/**
 * CTA di kanan bawah hero — dua blok datar berdampingan:
 * [ label ] [ → ]. Hover: blok berubah ke warna ink, panah meluncur keluar-masuk.
 * Memakai data-nav + data-reveal supaya ikut intro GSAP navbar dari Hero.tsx.
 */
export default function CtaButton({
  href = "#kontak",
  label = "Wujudkan idemu",
}: {
  href?: string;
  label?: string;
}) {
  const block =
    "bg-flame text-white transition-colors duration-300 ease-out group-hover:bg-ink group-focus-visible:bg-ink";

  return (
    <a
      href={href}
      data-nav
      data-reveal
      style={{ fontFamily: "'AcerokMages', serif" }}
      className="group absolute bottom-[clamp(16px,2.4vw,40px)] right-[1.8vw] z-20 flex h-[clamp(34px,3.1vw,48px)] items-stretch gap-[2px] font-acerok text-[clamp(11px,0.9vw,14px)] font-normal uppercase leading-none tracking-normal focus-visible:outline-none max-sm:right-3"
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 34 34"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-[1.3em] w-[1.3em] ${className ?? ""}`}
    >
      <path d="M17.0898 1.7002C17.2107 3.9668 17.3173 6.2334 17.4951 8.5C17.6134 10.0086 17.8886 11.5172 18.1203 13.0258C18.344 14.4832 19.5159 15.6549 20.9732 15.8789C22.4822 16.1108 23.9911 16.3865 25.5 16.5049C27.7666 16.6827 30.0333 16.7893 32.2998 16.9102C32.8664 16.9404 33.4334 16.9716 34 17.0049C33.4334 17.0382 32.8664 17.0694 32.2998 17.0996C30.0332 17.2205 27.7666 17.3271 25.5 17.5049C23.9901 17.6233 22.4802 17.8988 20.9702 18.1306C19.5137 18.3541 18.3421 19.5243 18.1175 20.9807C17.8862 22.48 17.6125 23.9793 17.4951 25.4785C17.3171 27.7523 17.2108 30.0261 17.0898 32.2998C17.0597 32.8665 17.0284 33.4333 16.9951 34C16.9619 33.4333 16.9305 32.8665 16.9004 32.2998C16.7795 30.0261 16.6731 27.7523 16.4951 25.4785C16.3777 23.9786 16.1034 22.4785 15.8718 20.9785C15.647 19.5227 14.4763 18.3526 13.0203 18.129C11.5135 17.8976 10.0067 17.6231 8.5 17.5049C6.23344 17.3271 3.96675 17.2205 1.7002 17.0996C1.13357 17.0694 0.566624 17.0382 0 17.0049C0.566628 16.9716 1.13357 16.9404 1.7002 16.9102C3.96676 16.7893 6.23344 16.6826 8.5 16.5049C10.0057 16.3868 11.5115 16.1121 13.0173 15.8805C14.4741 15.6564 15.6451 14.4848 15.869 13.0279C16.101 11.5186 16.3767 10.0093 16.4951 8.5C16.6729 6.2334 16.7795 3.9668 16.9004 1.7002C16.9306 1.13353 16.9618 0.566667 16.9951 0C17.0285 0.566667 17.0596 1.13353 17.0898 1.7002Z" />
    </svg>
  );
}