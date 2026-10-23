"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  children: React.ReactNode;
  className?: string;
};

type Prepared = {
  type: string;
  amp: number;
  chars: HTMLElement[];
  words: HTMLElement[];
  lines: HTMLElement[][];
};

/* Elemen [data-anim] disembunyikan lewat CSS sejak server render, jadi tidak
   ada kedipan teks sebelum GSAP siap. Pengguna reduced-motion tidak terkena
   aturan ini sehingga teks langsung tampil. */
const HIDE_CSS = `@media (prefers-reduced-motion: no-preference){.resume-motion [data-anim]{visibility:hidden}}`;
const NOSCRIPT_CSS = `.resume-motion [data-anim]{visibility:visible!important}`;

/* Pecah teks (termasuk di dalam elemen anak) jadi kata -> karakter.
   <br> dibiarkan, spasi dipertahankan. */
function splitText(el: HTMLElement, perChar: boolean) {
  const chars: HTMLElement[] = [];
  const words: HTMLElement[] = [];

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();

        (child.textContent ?? "").split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.append(" ");
            return;
          }

          const word = document.createElement("span");
          word.setAttribute("aria-hidden", "true");
          word.style.display = "inline-block";
          word.style.whiteSpace = "nowrap";
          word.style.willChange = "transform";

          if (perChar) {
            Array.from(part).forEach((ch) => {
              const c = document.createElement("span");
              c.style.display = "inline-block";
              c.style.willChange = "transform";
              c.textContent = ch;
              word.append(c);
              chars.push(c);
            });
          } else {
            word.textContent = part;
          }

          words.push(word);
          frag.append(word);
        });

        child.replaceWith(frag);
      } else if (child.nodeName !== "BR") {
        walk(child);
      }
    });
  };

  walk(el);
  return { chars, words };
}

export default function ResumeMotion({ children, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Grup yang sudah diputar tetap tampil saat layout dihitung ulang.
  const playedRef = useRef<Set<number>>(new Set());
  const [layoutKey, setLayoutKey] = useState(0);

  // Baris paragraf dihitung dari layout, jadi hitung ulang setelah font siap
  // dan saat lebar layar berubah.
  useEffect(() => {
    let timer: number | undefined;
    let lastWidth = window.innerWidth;
    const bump = () => setLayoutKey((k) => k + 1);
    const onResize = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      window.clearTimeout(timer);
      timer = window.setTimeout(bump, 250);
    };

    document.fonts?.ready.then(bump);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const media = gsap.matchMedia();
      const restores: Array<() => void> = [];

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const rand = gsap.utils.random;

        // Glitch masuk (sama dengan section Skills, durasi dipersingkat).
        const glitchTo = (
          tl: gsap.core.Timeline,
          target: gsap.TweenTarget,
          at: number,
          amp = 1
        ) => {
          tl.to(
            target,
            {
              keyframes: [
                {
                  autoAlpha: 1,
                  x: rand(-12, 12) * amp,
                  skewX: rand(-30, 30) * amp,
                  duration: 0.035,
                },
                {
                  autoAlpha: 0.1,
                  x: rand(-8, 8) * amp,
                  skewX: rand(-20, 20) * amp,
                  duration: 0.035,
                },
                {
                  autoAlpha: 1,
                  x: rand(-5, 5) * amp,
                  skewX: 0,
                  duration: 0.035,
                },
                { autoAlpha: 0.5, x: rand(-3, 3) * amp, duration: 0.03 },
                { autoAlpha: 1, x: 0, skewX: 0, duration: 0.04 },
              ],
              ease: "none",
            },
            at
          );
        };

        // 1) Kelompokkan elemen per [data-group].
        const items = gsap.utils.toArray<HTMLElement>("[data-anim]", root);
        const groups = new Map<HTMLElement, HTMLElement[]>();

        items.forEach((el) => {
          const group = el.closest<HTMLElement>("[data-group]") ?? el;
          groups.set(group, [...(groups.get(group) ?? []), el]);
        });

        const groupList = Array.from(groups.entries());
        const pending: Array<{
          index: number;
          trigger: HTMLElement;
          els: HTMLElement[];
        }> = [];

        groupList.forEach(([trigger, els], index) => {
          if (playedRef.current.has(index)) {
            // Sudah pernah diputar: langsung tampil tanpa animasi ulang.
            els.forEach((el) => {
              gsap.set(el, { autoAlpha: 1 });
            });
          } else {
            pending.push({ index, trigger, els });
          }
        });

        // 2) Pecah teks dulu semuanya, baru hitung baris (layout sudah final).
        const prepared = new Map<HTMLElement, Prepared>();

        pending.forEach(({ els }) => {
          els.forEach((el) => {
            const type = el.dataset.anim ?? "fade";
            const size = parseFloat(getComputedStyle(el).fontSize) || 16;
            // Judul kecil digeser lebih halus daripada judul besar.
            const amp = Math.min(1, Math.max(0.3, size / 48));
            const info: Prepared = {
              type,
              amp,
              chars: [],
              words: [],
              lines: [],
            };

            if (type === "title" || type === "lines") {
              const original = el.innerHTML;
              const label = el.getAttribute("aria-label");

              if (type === "title") {
                el.setAttribute("aria-label", el.textContent ?? "");
              }

              const { chars, words } = splitText(el, type === "title");
              info.chars = chars;
              info.words = words;

              restores.push(() => {
                el.innerHTML = original;
                if (label === null) el.removeAttribute("aria-label");
                else el.setAttribute("aria-label", label);
              });
            }

            prepared.set(el, info);
          });
        });

        prepared.forEach((info) => {
          if (info.type !== "lines") return;

          let lineTop = Number.NEGATIVE_INFINITY;
          info.words.forEach((word) => {
            if (Math.abs(word.offsetTop - lineTop) > 4) {
              info.lines.push([]);
              lineTop = word.offsetTop;
            }
            info.lines[info.lines.length - 1].push(word);
          });
        });

        // 3) Keadaan awal. Untuk title/lines, wadahnya dibuat terlihat dan
        //    yang disembunyikan adalah karakter/katanya.
        prepared.forEach((info, el) => {
          if (info.type === "title") {
            gsap.set(el, { visibility: "visible" });
            gsap.set(info.chars, { autoAlpha: 0 });
          } else if (info.type === "lines") {
            gsap.set(el, { visibility: "visible" });
            gsap.set(info.words, { autoAlpha: 0, x: 28, y: 22 });
          } else {
            gsap.set(el, { autoAlpha: 0 });
          }
        });

        // 4) Satu timeline + ScrollTrigger per grup (sekali jalan).
        pending.forEach(({ index, trigger, els }) => {
          const tl = gsap.timeline({ paused: true });
          let at = 0;

          els.forEach((el) => {
            const info = prepared.get(el);
            if (!info) return;

            if (info.type === "title") {
              const order = gsap.utils.shuffle(info.chars.map((_, i) => i));
              const spread = 0.35;

              info.chars.forEach((char, i) => {
                glitchTo(
                  tl,
                  char,
                  at +
                    (order[i] / Math.max(info.chars.length - 1, 1)) * spread,
                  info.amp
                );
              });
              at += 0.08;
            } else if (info.type === "lines") {
              info.lines.forEach((words, lineIndex) => {
                tl.fromTo(
                  words,
                  { autoAlpha: 0, x: 28, y: 22 },
                  {
                    autoAlpha: 1,
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: "power2.out",
                    immediateRender: false,
                  },
                  at + lineIndex * 0.06
                );
              });
              at += 0.1;
            } else {
              glitchTo(tl, el, at, 0.5);
              at += 0.04;
            }
          });

          ScrollTrigger.create({
            trigger,
            start: "top 85%",
            once: true,
            onEnter: () => {
              playedRef.current.add(index);
              tl.play();
            },
          });
        });
      });

      return () => {
        media.revert();
        restores.forEach((restore) => restore());
      };
    },
    { scope: rootRef, dependencies: [layoutKey], revertOnUpdate: true }
  );

  return (
    <div ref={rootRef} className={`resume-motion ${className}`}>
      <style>{HIDE_CSS}</style>
      <noscript>
        <style>{NOSCRIPT_CSS}</style>
      </noscript>
      {children}
    </div>
  );
}