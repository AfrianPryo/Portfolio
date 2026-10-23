export type ProjectCategory = "website" | "design" | "art";

export type Project = {
  slug: string;
  title: string;
  description: string;
  category: ProjectCategory;
  image: string;

  // Detail untuk sidebar di section Works (semua opsional).
  /** Penjelasan panjang; pisahkan paragraf dengan baris kosong. */
  overview?: string;
  /** Poin-poin hasil / fitur utama. */
  highlights?: readonly string[];
  /** Teknologi (website) atau tools (design & art). */
  technologies?: readonly string[];
  year?: string | number;
  role?: string;
  client?: string;
  /** Lama pengerjaan, mis. "3 bulan". */
  duration?: string;
  /** Tautan proyek live. */
  url?: string;
  /** Foto asli untuk galeri sidebar. Kosong = pakai foto dummy. */
  images?: readonly string[];
};

export const PROJECTS = [
  {
    slug: "agilism-abcde",
    title: "AGILISM ABCDE",
    description: "Proyek website pilihan.",
    category: "website",
    image: "/projects/project-1.svg",
    overview:
      "Website company profile untuk platform pelatihan agile. Fokusnya membuat alur informasi yang jelas dari halaman utama sampai pendaftaran, dengan tampilan yang tegas dan mudah dibaca di semua ukuran layar.\n\nSetiap section dirancang modular sehingga tim konten bisa menambah halaman baru tanpa bantuan developer.",
    highlights: [
      "Halaman memuat di bawah 2 detik pada koneksi 4G",
      "Animasi scroll kustom yang tetap ramah reduced-motion",
      "CMS headless untuk pengelolaan konten mandiri",
    ],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "GSAP", "Sanity"],
    year: 2025,
    role: "Design & Development",
    client: "Agilism",
    duration: "3 bulan",
    url: "https://example.com/agilism",
  },
  {
    slug: "solaris",
    title: "SOLARIS",
    description: "Neo-brutalist commerce.",
    category: "website",
    image: "/projects/project-5.svg",
    overview:
      "Toko online bergaya neo-brutalist untuk produk perlengkapan surya. Tipografi besar, kontras tinggi, dan grid yang sengaja kasar dipakai supaya brand terasa berani dan mudah diingat.\n\nCheckout dibuat sesingkat mungkin: tiga langkah, tanpa pindah halaman.",
    highlights: [
      "Checkout tiga langkah tanpa reload halaman",
      "Katalog dengan filter dan pencarian instan",
      "Skor Lighthouse 95+ untuk performa dan aksesibilitas",
    ],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe", "Zustand"],
    year: 2025,
    role: "Design & Development",
    client: "Solaris Co.",
    duration: "4 bulan",
    url: "https://example.com/solaris",
  },
  {
    slug: "chrono-archive",
    title: "CHRONO ARCHIVE",
    description: "Kinetic typography experiment.",
    category: "design",
    image: "/projects/project-2.svg",
    overview:
      "Eksperimen tipografi bergerak yang menjelajahi bagaimana waktu bisa diterjemahkan menjadi bentuk huruf. Rangkaian poster dan motion loop ini mengubah arsip tanggal menjadi komposisi visual yang berulang.\n\nSeluruh karya dibuat sebagai seri supaya bisa dibaca sebagai satu sistem visual.",
    highlights: [
      "12 poster dan 6 motion loop dalam satu sistem visual",
      "Typeface kustom dimodifikasi dari font open source",
    ],
    technologies: ["Figma", "Illustrator", "After Effects"],
    year: 2024,
    role: "Visual Design",
    duration: "6 minggu",
  },
  {
    slug: "lumen-analytics",
    title: "LUMEN ANALYTICS",
    description: "Real-time GPU trading visualizer.",
    category: "design",
    image: "/projects/project-3.svg",
    overview:
      "Desain antarmuka dashboard untuk memvisualisasikan data trading secara real-time. Tantangan utamanya menampilkan banyak data sekaligus tanpa membuat pengguna kewalahan.\n\nPalet gelap dengan aksen neon dipilih agar perubahan data tetap terbaca dalam sesi panjang.",
    highlights: [
      "Design system lengkap dengan 40+ komponen",
      "Mode gelap dan terang dengan token warna terpusat",
      "Prototipe interaktif diuji bersama calon pengguna",
    ],
    technologies: ["Figma", "Principle", "Spline"],
    year: 2025,
    role: "UI/UX Design",
    client: "Lumen Labs",
    duration: "2 bulan",
  },
  {
    slug: "aura-sound-lab",
    title: "AURA SOUND LAB",
    description: "Generative frequency synthesis.",
    category: "art",
    image: "/projects/project-4.svg",
    overview:
      "Karya seni generatif yang menerjemahkan frekuensi suara menjadi bentuk visual yang terus berubah. Setiap render unik karena dihasilkan dari parameter acak yang terikat pada spektrum audio.\n\nHasil terbaiknya dipilih dan dicetak sebagai seri karya.",
    highlights: [
      "Ratusan variasi dihasilkan, 8 dipilih untuk seri akhir",
      "Dipamerkan sebagai instalasi layar dan cetak",
    ],
    technologies: ["TouchDesigner", "Blender", "Photoshop"],
    year: 2024,
    role: "Generative Art",
    duration: "5 minggu",
  },
] as const satisfies readonly Project[];