import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ResumeMotion from "@/components/ResumeMotion";

export const metadata: Metadata = {
  title: "Resume dan Profil",
  description:
    "Resume Afrian Pryo Sulistyanno, UI/UX Designer dan Junior Fullstack Developer. Lihat pengalaman, pendidikan, keterampilan, dan profil lengkap.",
  alternates: {
    canonical: "/resume",
  },
  openGraph: {
    title: "Resume dan Profil Afrian Pryo Sulistyanno",
    description:
      "Pengalaman, pendidikan, keterampilan, dan profil Afrian Pryo Sulistyanno sebagai UI/UX Designer dan Junior Fullstack Developer.",
    url: "/resume",
    type: "profile",
  },
};

const EMAIL = "annosulistyanno@gmail.com";
const PHONE = "+62 882 3895 9665";

// Video latar yang sama dengan section Contact.
const BG_SRC = "/contact-bg.mp4";

const about =
  "Siswa PPLG di SMKN 1 Bangsri yang berfokus sebagai UI/UX Designer dan Junior Fullstack Developer. Berpengalaman merancang desain antarmuka pengguna serta mengembangkan aplikasi web modern dengan React, Laravel, dan MySQL. Berkomitmen untuk terus belajar, berkolaborasi dalam tim, dan menghasilkan produk digital yang responsif serta berorientasi pada pengalaman pengguna.";

type Entry = {
  title: string;
  role: string;
  place: string;
  period: string;
  text: string;
};

const experiences: Entry[] = [
  {
    title: "Web Portofolio",
    role: "UI/UX Designer",
    place: "Sinanggul, Jepara",
    period: "2026 — Sekarang",
    text: "Proyek individu untuk merancang UI/UX website portofolio pribadi, dari struktur halaman sampai gaya visualnya, sebagai karya mandiri dari seorang siswa.",
  },
  {
    title: "Compify E-Commerce",
    role: "UI/UX Designer",
    place: "Bangsri, Jepara",
    period: "2026 — Sekarang",
    text: "Proyek grup untuk mendesain UI/UX sebuah e-commerce. Dikerjakan sebagai tugas akhir kelas XI PPLG 2026.",
  },
  {
    title: "Sertifikasi Dicoding",
    role: "Junior Data Scientist",
    place: "Bangsri, Jepara",
    period: "2026 — Sekarang",
    text: "Mengikuti pembelajaran Dicoding secara mandiri untuk meraih sertifikasi Junior Data Scientist.",
  },
  {
    title: "Game Development",
    role: "Fullstack Developer",
    place: "Bangsri, Jepara",
    period: "2025 — 2026",
    text: "Proyek individu membuat game sederhana, bagian dari pembelajaran pengembangan game di jurusan.",
  },
  {
    title: "Pengembangan CRUD",
    role: "Fullstack Developer",
    place: "Bangsri, Jepara",
    period: "2025",
    text: "Membangun sistem utuh untuk dashboard CRUD secara individu. Dikerjakan sebagai tugas kelas XI PPLG 2026.",
  },
  {
    title: "Aplikasi Edukasi",
    role: "Fullstack Developer",
    place: "Bangsri, Jepara",
    period: "2024 — 2025",
    text: "Membangun sistem utuh untuk aplikasi edukasi secara individu, sebagai tugas akhir kelas X PPLG 2026.",
  },
  {
    title: "Aplikasi Edukasi",
    role: "UI/UX Designer",
    place: "Bangsri, Jepara",
    period: "2024 — 2025",
    text: "Mendesain UI/UX aplikasi edukasi berbasis web secara individu, sebagai tugas akhir kelas X PPLG 2025.",
  },
];

const education: Entry[] = [
  {
    title: "SMKN 1 Bangsri",
    role: "Pendidikan Menengah Kejuruan",
    place: "Bangsri, Jepara",
    period: "2023 — Sekarang",
    text: "Menempuh pendidikan menengah kejuruan sambil mengasah komunikasi dan manajemen. Belajar UI/UX Design, Web Development, dan dasar Mobile App Development.",
  },
  {
    title: "MTSs Mathalibul Huda",
    role: "Pendidikan Menengah Pertama",
    place: "Mlonggo, Jepara",
    period: "2021 — 2023",
    text: "Menempuh pendidikan keagamaan dan pendidikan tingkat menengah pertama.",
  },
  {
    title: "SDN 4 Sinanggul",
    role: "Pendidikan Dasar",
    place: "Mlonggo, Jepara",
    period: "2015 — 2021",
    text: "Menempuh pendidikan tingkat dasar.",
  },
];

const software =
  "Adobe After Effects, Adobe Illustrator, Adobe Photoshop, Affinity, Android Studio, Arduino, Blender, Canva, Cavalry, Figma, Framer, Git, MongoDB, Postman, Visual Studio, VSCode.";

// Judul hero: blur per huruf makin ke ujung, sama seperti heading di Contact.
const HERO_WORD = "RESUME";
const HERO_BLUR = [0, 0, 1, 2, 4, 6];
const BLUR_STEP = 0.012;

// Bingkai merah #B30814 di atas latar #080000, sama seperti Contact.
const FRAME =
  "relative isolate overflow-hidden bg-[#B30814] text-white px-[6vw] py-[10vw] lg:px-[2vw] lg:py-[2vw]";

// Label kecil Switzer huruf kecil, ukuran disamakan dengan teks kecil Contact.
const SMALL =
  "font-switzer text-[clamp(10px,0.75vw,12px)] font-medium lowercase leading-[1.1] tracking-[-0.05em]";

/* Video latar yang sama dengan Contact (grain + figur sudah ada di dalam video). */
function Bg() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 scale-[1.14]"
    >
      <video
        src={BG_SRC}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        draggable={false}
        className="h-full w-full select-none object-cover object-center"
      />
    </div>
  );
}

/* Teks kecil dua baris: label (70%) di atas, isi di bawah */
function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <p data-anim="fade" className={SMALL}>
      <span className="block opacity-70">{label}</span>
      <span className="block normal-case">{children}</span>
    </p>
  );
}

/* Label section di kolom kiri */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p data-anim="fade" className={`${SMALL} text-white/70 md:col-span-3`}>
      {children}
    </p>
  );
}

/* Paragraf polos */
function Prose({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      data-anim="lines"
      className={`font-switzer text-[clamp(12px,0.9vw,14px)] leading-[1.35] tracking-[-0.01em] text-white/75 ${className}`}
    >
      {children}
    </p>
  );
}

/* Judul section: Acerok kapital putih, tracking rapat seperti heading Contact */
function Heading({
  id,
  children,
}: {
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      data-anim="title"
      className="font-acerok text-[clamp(22px,2.8vw,44px)] font-normal uppercase leading-[0.92] tracking-[-0.07em] text-white"
    >
      {children}
    </h2>
  );
}

/* Daftar entri: periode | judul & peran | deskripsi, dipisah garis tipis */
function Rows({ items }: { items: Entry[] }) {
  return (
    <ol className="mt-10 md:mt-16">
      {items.map((item) => (
        <li
          key={`${item.title}-${item.role}`}
          data-group
          className="grid gap-y-3 border-t border-white/15 py-5 md:grid-cols-12 md:gap-x-4 md:py-6"
        >
          <p data-anim="fade" className={`${SMALL} md:col-span-3`}>
            <span className="block">{item.period}</span>
            <span className="block opacity-70">{item.place}</span>
          </p>
          <h3
            data-anim="title"
            className="font-acerok text-[clamp(13px,1.1vw,17px)] font-normal uppercase leading-[1] tracking-[-0.04em] text-white md:col-span-4"
          >
            {item.title}
            <br />
            <span className="text-white/60">{item.role}</span>
          </h3>
          <Prose className="md:col-span-5">{item.text}</Prose>
        </li>
      ))}
    </ol>
  );
}

export default function ResumePage() {
  return (
    <>
      <Navbar isResumePage />
      <main className="min-h-screen overflow-x-clip bg-[#080000] pb-[2vw] text-white">
        <ResumeMotion className="relative isolate w-full">
          {/* ===== Hero: bingkai merah + video, seperti Contact ===== */}
          <header
            data-group
            className={`${FRAME} flex min-h-svh flex-col justify-between gap-16 max-lg:pt-40 lg:pt-[13vw]`}
          >
            <Bg />

            <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 lg:grid-cols-6">
              <Info label="name">Afrian Pryo Sulistyanno</Info>
              <Info label="role">Graphic Designer &amp; Junior Developer</Info>
              <Info label="email">
                <a
                  href={`mailto:${EMAIL}`}
                  className="break-all underline-offset-[0.2em] hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  {EMAIL}
                </a>
              </Info>
              <Info label="phone">
                <a
                  href="tel:+6288238959665"
                  className="underline-offset-[0.2em] hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  {PHONE}
                </a>
              </Info>
              <Info label="instagram">@__afffr</Info>
              <Info label="location">
                Sinanggul, Mlonggo, Jepara, Jawa Tengah 59452
              </Info>
            </div>

            <h1
              data-anim="fade"
              className="whitespace-nowrap font-acerok text-[11vw] font-normal uppercase leading-[0.8] tracking-[-0.07em]"
            >
              <span className="sr-only">Resume</span>
              {Array.from(HERO_WORD).map((char, i) => {
                const blur = (HERO_BLUR[i] ?? 0) * BLUR_STEP;
                return (
                  <span
                    key={`${char}-${i}`}
                    aria-hidden="true"
                    className="inline-block"
                    style={blur ? { filter: `blur(${blur}em)` } : undefined}
                  >
                    {char}
                  </span>
                );
              })}
            </h1>
          </header>

          {/* ===== Tentang ===== */}
          <section
            data-group
            aria-labelledby="resume-about"
            className="mt-24 grid gap-y-8 px-[6vw] md:mt-36 md:grid-cols-12 md:gap-x-4 lg:px-[2vw]"
          >
            <Label>tentang</Label>
            <div className="md:col-span-9">
              <Heading id="resume-about">
                Masih belajar,
                <br />
                terus mencoba
              </Heading>
              <div className="mt-8 max-w-[400px] md:mt-12">
                <Prose>{about}</Prose>
                <a
                  data-anim="fade"
                  href={`mailto:${EMAIL}`}
                  className="mt-5 inline-block font-switzer text-[11px] font-bold uppercase tracking-[0.02em] text-white underline decoration-[1.5px] underline-offset-[5px] transition-colors hover:text-flame focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Hubungi saya
                </a>
              </div>
            </div>
          </section>

          {/* ===== Pengalaman ===== */}
          <section
            data-group
            aria-labelledby="resume-experience"
            className="mt-28 px-[6vw] md:mt-40 lg:px-[2vw]"
          >
            <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-4">
              <Label>pengalaman</Label>
              <div className="md:col-span-9">
                <Heading id="resume-experience">
                  Proses bicara
                  <br />
                  lebih keras
                  <br />
                  dari kata-kata
                </Heading>
              </div>
            </div>
            <Rows items={experiences} />
          </section>

          {/* ===== Pendidikan ===== */}
          <section
            data-group
            aria-labelledby="resume-education"
            className="mt-24 px-[6vw] md:mt-36 lg:px-[2vw]"
          >
            <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-4">
              <Label>pendidikan</Label>
              <div className="md:col-span-9">
                <Heading id="resume-education">
                  Dasar yang
                  <br />
                  membentuk arah
                </Heading>
              </div>
            </div>
            <Rows items={education} />
          </section>

          {/* ===== Software ===== */}
          <section
            data-group
            aria-labelledby="resume-software"
            className="mt-24 grid gap-y-8 px-[6vw] md:mt-36 md:grid-cols-12 md:gap-x-4 lg:px-[2vw]"
          >
            <Label>software</Label>
            <div className="md:col-span-9">
              <Heading id="resume-software">
                Perangkat
                <br />
                sehari-hari
              </Heading>
              <Prose className="mt-8 max-w-[400px] md:mt-12">{software}</Prose>
            </div>
          </section>

          {/* ===== Unduh: bingkai merah penutup, sama seperti Contact ===== */}
          <section
            data-group
            aria-labelledby="resume-download"
            className={`${FRAME} mx-[2vw] mt-28 flex min-h-[max(480px,65svh)] flex-col justify-between gap-16 md:mt-40`}
          >
            <Bg />

            <h2
              id="resume-download"
              data-anim="title"
              className="font-acerok text-[clamp(26px,4.2vw,64px)] font-normal uppercase leading-[0.92] tracking-[-0.07em]"
            >
              Versi lengkap
              <br />
              dalam satu berkas
            </h2>

            <div className="flex items-end justify-between gap-6">
              {/* Tombol sama persis dengan submit di Contact, termasuk ikon plus saat hover */}
              <a
                data-anim="fade"
                href="/resume.pdf"
                download
                className="group flex h-11 items-center bg-white px-4 font-switzer text-base lowercase tracking-[-0.05em] text-[#B30814] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:h-[1.82vw] lg:px-[0.6vw] lg:text-[0.8vw]"
              >
                unduh resume
                <span
                  aria-hidden="true"
                  className="ml-0 block h-[10px] w-0 shrink-0 bg-current opacity-0 transition-all duration-300 group-hover:ml-1 group-hover:w-[10px] group-hover:opacity-100 group-focus-visible:ml-1 group-focus-visible:w-[10px] group-focus-visible:opacity-100 lg:h-[0.6vw] lg:group-hover:ml-[0.25vw] lg:group-hover:w-[0.6vw] lg:group-focus-visible:ml-[0.25vw] lg:group-focus-visible:w-[0.6vw]"
                  style={{
                    WebkitMaskImage: "url(/icon-custom/Plus.svg)",
                    maskImage: "url(/icon-custom/Plus.svg)",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                  }}
                />
              </a>
              <p data-anim="fade" className={`${SMALL} text-right`}>
                <span className="block normal-case">Afrian Pryo Sulistyanno</span>
                <span className="block opacity-70">resume 2026</span>
              </p>
            </div>
          </section>
        </ResumeMotion>
      </main>
    </>
  );
}