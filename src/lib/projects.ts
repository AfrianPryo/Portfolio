export type ProjectCategory = "website" | "design" | "art";

// Gambar dengan rasio tampil (lebar / tinggi). Gambar yang sangat panjang
// (full-page screenshot) dipotong dari atas lewat object-top di Works.
export type ProjectImage = { src: string; ratio: number };

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  description: string;
  overview?: string;
  year?: number | string;
  role?: string;
  client?: string;
  duration?: string;
  contributions?: string[];
  /** Daftar string lama (dipertahankan agar kompatibel). */
  images?: string[];
  /** Gambar di baris section Works (total rasio dijaga <= ~3). */
  slides?: ProjectImage[];
  /** Gambar di galeri sidebar. */
  gallery?: ProjectImage[];
  /** Hanya diisi untuk proyek web yang sudah live. */
  url?: string;
  repo?: string;
};

const img = (slug: string, file: string, ratio: number): ProjectImage => ({
  src: `/projects/${slug}/${file}`,
  ratio,
});

export const PROJECTS: Project[] = [
  // ───────────────────────── WEBSITE ─────────────────────────
  {
    slug: "usman",
    title: "USMAN",
    category: "website",
    description:
      "Sistem manajemen Usaha Mandiri SMKN 1 Bangsri: transaksi, inventaris, aset, dan laporan seluruh unit usaha sekolah dalam satu dashboard.",
    overview:
      "USMAN (Usaha Mandiri) adalah aplikasi web untuk mengelola unit-unit usaha milik sekolah, seperti Alfamart, Bengkel, Fotokopi, TEFA, dan Teh Siswa. Sebelumnya pencatatan tersebar di buku dan berkas terpisah, sehingga rekap pendapatan, pengeluaran, dan laba sulit dipantau.\n\nDi USMAN, admin master dapat melihat statistik seluruh unit usaha, sementara tiap unit mencatat transaksinya sendiri. Surat dan laporan resmi dibuat otomatis dari template ber-KOP, lengkap dengan tanda tangan dan nomor surat.",
    year: 2025,
    role: "Design & Development",
    client: "SMKN 1 Bangsri",
    contributions: [
      "Merancang UI/UX dashboard admin master dan dashboard unit usaha",
      "Membangun aplikasi dengan Laravel dan Vite",
      "Membuat modul transaksi, inventaris, aset, dan pembelian lintas unit",
      "Membuat statistik dan grafik performa pendapatan, pengeluaran, dan laba",
      "Membuat fitur dokumen resmi otomatis dari template ber-KOP surat",
      "Menyusun landing page, halaman login, dan pengaturan sistem",
      "Deploy ke domain sekolah",
    ],
    slides: [
      img("usman", "landing-usman.webp", 0.8),
      img("usman", "dashboard-usman.webp", 0.85),
      img("usman", "dashboard-unit-usman.webp", 1.04),
    ],
    gallery: [
      img("usman", "landing-usman.webp", 0.8),
      img("usman", "login-usman.webp", 2.222),
      img("usman", "dashboard-usman.webp", 0.85),
      img("usman", "dashboard-unit-usman.webp", 1.04),
      img("usman", "statistik-unit-usman.webp", 0.77),
      img("usman", "admin-usman.webp", 2.025),
      img("usman", "dokumen-usman.webp", 2.025),
      img("usman", "settings-usman.webp", 1.098),
    ],
    url: "https://manajemen-usman.smkn1bangsri.sch.id/",
    repo: "https://github.com/AfrianPryo/manajemen-usman",
  },
  {
    slug: "compify",
    title: "Compify",
    category: "website",
    description:
      "Toko online perlengkapan komputer dengan katalog produk, pembayaran, event promo, dan panel admin lengkap.",
    overview:
      "Compify adalah website toko perlengkapan komputer: motherboard, RAM, monitor, keyboard, dan peripheral lain. Pengunjung bisa menjelajah kategori, melihat produk terlaris dan terbaru, lalu membayar lewat metode pembayaran yang tersedia.\n\nDi sisi admin, tersedia dashboard untuk mengelola produk, kategori, event promo, metode pembayaran, dan melihat analitik penjualan.",
    year: 2026,
    role: "Design & Development",
    client: "Proyek pribadi",
    contributions: [
      "Merancang UI/UX toko dan panel admin",
      "Membangun aplikasi dengan Laravel dan Vite",
      "Membuat katalog produk, kategori, dan halaman detail",
      "Membuat alur pembayaran dan pengelolaan metode pembayaran",
      "Membuat fitur event dan diskon produk",
      "Membuat dashboard dan analitik admin",
      "Merancang ERD dan flowchart sistem",
    ],
    slides: [
      img("compify", "compify-toko-perlengkapan-komputer.webp", 0.8),
      img("compify", "dashboard.webp", 1.4),
      img("compify", "produk-compify.webp", 0.78),
    ],
    gallery: [
      img("compify", "banner-compify.webp", 2.321),
      img("compify", "compify-toko-perlengkapan-komputer.webp", 0.8),
      img("compify", "kategori-produk-compify.webp", 0.8),
      img("compify", "produk-compify.webp", 0.779),
      img("compify", "pembayaran-compify.webp", 0.952),
      img("compify", "dashboard.webp", 1.57),
      img("compify", "analytics.webp", 1.148),
      img("compify", "atur-event-compify.webp", 2.025),
      img("compify", "payment-methods-admin-compify.webp", 1.074),
    ],
    // url belum ada: proyek belum di-deploy, jadi tombol "Kunjungi proyek" tidak tampil.
    repo: "https://github.com/rayyanqatrunada/Compify",
  },

  // ───────────────────────── DESIGN ─────────────────────────
  {
    slug: "dashboard-trading",
    title: "Crypto Dashboard",
    category: "design",
    description:
      "Desain dashboard trading kripto bertema gelap: proyek trending, harga token, dan data exchange dalam satu layar.",
    overview:
      "Konsep antarmuka dashboard untuk memantau aset kripto. Layout dibuat padat tetapi tetap mudah dipindai: kartu proyek trending dengan grafik harga, tabel pasar, dan daftar exchange.\n\nPalet gelap dengan aksen ungu menjaga fokus pada angka dan perubahan harga, dengan hierarki tipografi yang jelas.",
    year: 2025,
    role: "UI Design",
    client: "Konsep pribadi",
    contributions: [
      "Riset referensi dashboard trading dan Web3",
      "Menyusun layout, grid, dan hierarki informasi",
      "Merancang komponen: kartu token, tabel pasar, dan sidebar",
      "Menentukan palet warna dan tipografi mode gelap",
      "Membuat mockup presentasi",
    ],
    slides: [
      img("dashboard-trading", "mockup-dashboard.webp", 1.333),
      img("dashboard-trading", "dashboard-design.webp", 1.406),
    ],
    gallery: [
      img("dashboard-trading", "mockup-dashboard.webp", 1.333),
      img("dashboard-trading", "dashboard-design.webp", 1.406),
      img("dashboard-trading", "dashboard-only.webp", 1.467),
    ],
  },
  {
    slug: "health-care",
    title: "MonoCare",
    category: "design",
    description:
      "Desain dashboard layanan kesehatan: ringkasan pasien, pemantauan data real-time, dan risiko kesehatan per sistem tubuh.",
    overview:
      "MonoCare adalah konsep dashboard untuk tenaga kesehatan. Satu layar menampilkan profil pasien, riwayat medis, pembelian obat, tekanan darah, detak jantung, dan visual anatomi tubuh.\n\nPanel Health Risks merangkum risiko per sistem tubuh dengan indikator warna, sehingga kondisi pasien bisa dipahami sekilas. Warna hijau lembut dipilih agar terasa tenang dan bersih.",
    year: 2025,
    role: "UI/UX Design",
    client: "Konsep pribadi",
    contributions: [
      "Merancang struktur informasi data pasien yang kompleks",
      "Mendesain panel pemantauan real-time dan indikator risiko",
      "Membangun komponen kartu, timeline, dan indikator rentang nilai",
      "Menentukan palet warna dan tipografi yang tenang dan mudah dibaca",
      "Membuat mockup presentasi",
    ],
    slides: [
      img("health-care", "mockup.webp", 1.333),
      img("health-care", "dashboard.webp", 1.6),
    ],
    gallery: [
      img("health-care", "mockup.webp", 1.333),
      img("health-care", "dashboard.webp", 1.741),
    ],
  },
  {
    slug: "design-case-study",
    title: "Landing Page Studies",
    category: "design",
    description:
      "Dua studi desain landing page: ZeroAI yang monokrom dan Lightwave Studio yang hangat, lengkap dengan versi responsif.",
    overview:
      "Kumpulan studi desain landing page dengan karakter yang berlawanan. ZeroAI untuk perusahaan AI memakai hitam-putih, cahaya lengkung, dan statistik ringkas. Lightwave Studio untuk studio foto memakai gradien oranye, tipografi besar, dan komposisi foto yang dinamis.\n\nLightwave juga dibuat dalam beberapa tampilan mobile untuk menguji bagaimana tipografi dan layout beradaptasi di layar kecil.",
    year: 2025,
    role: "Web Design",
    client: "Studi mandiri",
    contributions: [
      "Menentukan arah visual dan mood tiap brand",
      "Mendesain landing page ZeroAI dan Lightwave Studio",
      "Eksplorasi tipografi besar dan komposisi gambar",
      "Membuat 4 tampilan responsif mobile untuk Lightwave",
    ],
    slides: [
      img("design-case-study", "landing-page-web-zeroai.webp", 1.406),
      img("design-case-study", "lightwave-studio-landing-page.webp", 0.7),
      img("design-case-study", "responsive-lightwave-1.webp", 0.4),
      img("design-case-study", "responsive-lightwave-2.webp", 0.4),
    ],
    gallery: [
      img("design-case-study", "landing-page-web-zeroai.webp", 1.406),
      img("design-case-study", "lightwave-studio-landing-page.webp", 0.7),
      img("design-case-study", "responsive-lightwave-1.webp", 0.4),
      img("design-case-study", "responsive-lightwave-2.webp", 0.4),
      img("design-case-study", "responsive-lightwave-3.webp", 0.4),
      img("design-case-study", "responsive-lightwave-4.webp", 0.4),
    ],
  },
  {
    slug: "woodora",
    title: "Woodora",
    category: "design",
    description:
      "Desain website toko furnitur bergaya minimal: hero bersih, produk sebagai fokus, dan tipografi yang lega.",
    overview:
      "Woodora adalah konsep website e-commerce furnitur. Latar putih, tipografi bersih, dan bentuk lengkung pada foto produk membuat kursi menjadi pusat perhatian.\n\nHalaman mencakup hero dengan slider, koleksi, testimoni, dan kontak, dengan pesan utama \"temukan furniture terbaik untuk ruang nyaman Anda\".",
    year: 2025,
    role: "UI Design",
    client: "Konsep pribadi",
    contributions: [
      "Merancang layout landing page dan hero",
      "Menyusun hierarki tipografi dan white space",
      "Mendesain navigasi, keranjang, dan komponen produk",
      "Membuat mockup presentasi",
    ],
    slides: [
      img("woodora", "mockup.webp", 1.333),
      img("woodora", "hero.webp", 1.491),
    ],
    gallery: [
      img("woodora", "mockup.webp", 1.333),
      img("woodora", "hero.webp", 1.491),
      img("woodora", "landing.webp", 0.6),
    ],
  },
];
