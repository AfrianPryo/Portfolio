import gsap from "gsap";

// Tangga clip-path yang sama dengan tirai di section Works.
// Simpan sebagai lib/stairClip.ts.
const STAIR_COLS = 12;
const STAIR_ROWS = 8;
const STAIR_SKEW = 1.6;
const STAIR_JITTER = [0, 0.5, 0.15, 0.7, 0.3, 0.6, 0.1, 0.45]; // >= 0
const STAIR_JITTER_MAX = Math.max(...STAIR_JITTER);

// "sine.inOut" = awal & akhir lebih landai dari power2.inOut.
const STAIR_EASE = "sine.inOut";

let stairEase: ((t: number) => number) | undefined;

// Polygon clip-path tangga untuk progres p (0..1). `mirror` = tumbuh dari
// kanan atas (bukan kiri atas). Lebar tiap baris kontinu supaya halus.
// Di p = 1 seluruh layar terisi.
export function stairClip(p: number, mirror = false) {
  stairEase ??= gsap.parseEase(STAIR_EASE);

  const total = STAIR_COLS + (STAIR_ROWS - 1) * STAIR_SKEW + STAIR_JITTER_MAX;
  const front = stairEase(p) * total;
  const pts: string[] = [mirror ? "100% 0%" : "0% 0%"];

  for (let r = 0; r < STAIR_ROWS; r += 1) {
    const cols = Math.max(
      0,
      Math.min(STAIR_COLS, front - r * STAIR_SKEW - (STAIR_JITTER[r] ?? 0))
    );
    const filled = (cols / STAIR_COLS) * 100;
    const x = (mirror ? 100 - filled : filled).toFixed(2);
    const top = ((r / STAIR_ROWS) * 100).toFixed(2);
    const bottom = (((r + 1) / STAIR_ROWS) * 100).toFixed(2);

    pts.push(`${x}% ${top}%`, `${x}% ${bottom}%`);
  }
  pts.push(mirror ? "100% 100%" : "0% 100%");

  return `polygon(${pts.join(",")})`;
}