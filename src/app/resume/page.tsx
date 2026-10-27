import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import CtaButton from "@/components/CtaButton";
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
    period: "2026 - Sekarang",
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

const letter = (i: number) => String.fromCharCode(65 + i);

/* Label kecil bergaya [ Teks ] */
function Bracket({ children }: { children: React.ReactNode }) {
  return (
    <span
      data-anim="fade"
      className="inline-block font-switzer text-[12px] font-medium leading-none tracking-[-0.01em] text-white/60"
    >
      [ {children} ]
    </span>
  );
}

/* Paragraf polos, baris pertama menjorok seperti di referensi */
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
      className={`font-switzer text-[14px] leading-[1.25] tracking-[-0.01em] text-white/75 [text-indent:2.4em] ${className}`}
    >
      {children}
    </p>
  );
}

/* Judul section: font Acerok kapital berwarna flame, sama seperti title di
   section Skills. */
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
      className="font-acerok text-[clamp(30px,4.3vw,68px)] font-normal uppercase leading-[1.05] tracking-[0.01em] text-flame"
    >
      {children}
    </h2>
  );
}

/* Ornamen latar: di belakang konten, tepi di-feather agar tidak terpotong */
function Ornament({
  src,
  ratio,
  className = "",
  imgClassName = "",
  fade = "x",
}: {
  src: string;
  ratio: [number, number];
  className?: string;
  imgClassName?: string;
  fade?: "x" | "y";
}) {
  const mask =
    fade === "x"
      ? "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)"
      : "linear-gradient(to bottom, black 0%, black 50%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 select-none ${className}`}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={ratio[0]}
        height={ratio[1]}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={`h-auto w-full ${imgClassName}`}
      />
    </div>
  );
}

/* Entri bergaya "cases": diselang-seling kiri/kanan dengan jeda vertikal */
function Cases({ items }: { items: Entry[] }) {
  return (
    <div className="mt-16 grid gap-y-14 md:mt-24 md:grid-cols-12 md:gap-y-0">
      {items.map((item, i) => {
        const right = i % 2 === 1;
        return (
          <article
            key={`${item.title}-${item.role}`}
            data-group
            className={`md:col-span-4 md:mb-16 ${
              right ? "md:col-start-8 md:mt-28" : "md:col-start-3"
            }`}
          >
            <div className="flex items-baseline gap-3">
              <Bracket>{letter(i)}</Bracket>
              <h3
                data-anim="title"
                className="font-switzer text-[14px] font-semibold leading-[1.1] tracking-[-0.01em] text-white"
              >
                {item.title}
                <br />
                {item.role}
              </h3>
            </div>
            <p
              data-anim="fade"
              className="mt-3 font-switzer text-[12px] leading-none text-white/45"
            >
              {item.period} &middot; {item.place}
            </p>
            <Prose className="mt-4">{item.text}</Prose>
          </article>
        );
      })}
    </div>
  );
}

export default function ResumePage() {
  return (
    <>
      <Navbar isResumePage />
      <main className="relative min-h-screen overflow-hidden bg-black px-[4vw] pb-16 pt-32 text-white max-sm:px-5 max-sm:pt-28">
        {/* Latar halaman: cahaya merah tipis dari atas + noise film grain */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_38%_at_50%_0%,rgba(255,34,0,0.16),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.webp')] opacity-[0.07] mix-blend-screen"
        />

        <ResumeMotion className="relative isolate z-10 mx-auto max-w-[1360px]">
          {/* ===== Header ===== */}
          <header data-group className="relative grid gap-y-10 md:grid-cols-12">
            <Ornament
              src="/resume-tribal.webp"
              ratio={[1609, 707]}
              className="left-1/2 top-[-4%] w-[min(120vw,1500px)] -translate-x-1/2 md:top-[-10%]"
              imgClassName="opacity-35 drop-shadow-[0_0_70px_rgba(255,34,0,0.25)]"
            />
            <div className="md:col-span-3">
              <Bracket>Resume</Bracket>
              <p
                data-anim="fade"
                className="mt-10 font-switzer text-[14px] font-semibold leading-[1.15] tracking-[-0.01em]"
              >
                Afrian Pryo Sulistyanno
                <br />
                <span className="font-normal">
                  Graphic Designer &amp; Junior Developer
                </span>
              </p>
              <address
                data-anim="lines"
                className="mt-5 font-switzer text-[13px] not-italic leading-[1.3] text-white/55"
              >
                {EMAIL}
                <br />
                +62 882 3895 9665
                <br />
                @__afffr
                <br />
                Sinanggul, Mlonggo, Jepara
                <br />
                Jawa Tengah 59452
              </address>
            </div>

            <h1
              data-anim="title"
              className="font-acerok text-[clamp(84px,17vw,270px)] font-normal uppercase leading-[0.8] text-flame max-sm:text-[clamp(64px,17vw,84px)] md:col-span-9 md:text-right"
            >
              Resume
            </h1>
          </header>

          {/* ===== Tentang ===== */}
          <section
            data-group
            aria-labelledby="resume-about"
            className="relative mt-28 grid gap-y-10 md:mt-40 md:grid-cols-12"
          >
            {/* Pegasus seperti di section Skills, di sisi kanan */}
            <Ornament
              src="/pegasus-skill.webp"
              ratio={[753, 975]}
              fade="y"
              className="right-[2%] top-1/2 h-auto w-[min(34vw,420px)] -translate-y-1/2 max-md:right-[-12%] max-md:w-[62vw] max-md:opacity-30"
              imgClassName="opacity-90"
            />
            <div className="md:col-span-3">
              <Bracket>Tentang</Bracket>
            </div>
            <div className="md:col-span-8 md:col-start-5">
              <Heading id="resume-about">
                Masih belajar,
                <br />
                terus mencoba
              </Heading>
              <div className="mt-12 max-w-[360px] md:ml-[10%] md:mt-16">
                <Prose>{about}</Prose>
                <a
                  data-anim="fade"
                  href={`mailto:${EMAIL}`}
                  className="mt-6 inline-block font-switzer text-[12px] font-bold uppercase tracking-[0.02em] text-white underline decoration-[1.5px] underline-offset-[5px] transition-colors hover:text-flame focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
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
            className="relative mt-32 md:mt-48"
          >
            <Ornament
              src="/lining-skill.webp"
              ratio={[2880, 1104]}
              className="left-1/2 top-[-6%] w-[min(150vw,1800px)] -translate-x-1/2 md:top-[-14%]"
              imgClassName="opacity-40"
            />
            <div className="grid gap-y-10 md:grid-cols-12">
              <div className="md:col-span-3">
                <Bracket>Pengalaman</Bracket>
              </div>
              <div className="md:col-span-8 md:col-start-5">
                <Heading id="resume-experience">
                  Proses bicara
                  <br />
                  lebih keras
                  <br />
                  dari kata-kata
                </Heading>
              </div>
            </div>
            <Cases items={experiences} />
          </section>

          {/* ===== Pendidikan ===== */}
          <section
            data-group
            aria-labelledby="resume-education"
            className="relative mt-24 md:mt-40"
          >
            <Ornament
              src="/resume-tribal.webp"
              ratio={[1609, 707]}
              className="left-1/2 top-[-8%] w-[min(120vw,1500px)] -translate-x-1/2 md:top-[-18%]"
              imgClassName="opacity-30 -scale-x-100 drop-shadow-[0_0_70px_rgba(255,34,0,0.2)]"
            />
            {/* Pilar Yunani, di tepi kanan, sebagai simbol "dasar" */}
            <Ornament
              src="/pillar-art-direction.webp"
              ratio={[843, 2124]}
              fade="y"
              className="right-[-2%] top-[4%] w-[min(20vw,260px)] max-md:w-[34vw] max-md:opacity-50"
              imgClassName="opacity-35"
            />
            <div className="grid gap-y-10 md:grid-cols-12">
              <div className="md:col-span-3">
                <Bracket>Pendidikan</Bracket>
              </div>
              <div className="md:col-span-8 md:col-start-5">
                <Heading id="resume-education">
                  Dasar yang
                  <br />
                  membentuk arah
                </Heading>
              </div>
            </div>
            <Cases items={education} />
          </section>

          {/* ===== Software ===== */}
          <section
            data-group
            aria-labelledby="resume-software"
            className="mt-24 grid gap-y-10 md:mt-40 md:grid-cols-12"
          >
            <div className="md:col-span-3">
              <Bracket>Software</Bracket>
            </div>
            <div className="md:col-span-8 md:col-start-5">
              <Heading id="resume-software">
                Perangkat
                <br />
                sehari-hari
              </Heading>
              <Prose className="mt-12 max-w-[360px] md:ml-[10%] md:mt-16">
                {software}
              </Prose>
            </div>
          </section>

          {/* ===== Unduh ===== */}
          <section
            data-group
            aria-labelledby="resume-download"
            className="relative mt-28 grid gap-y-8 md:mt-44 md:grid-cols-12"
          >
            {/* Ornamen kiri-kanan, sama dengan section Contact */}
            <Ornament
              src="/contact-ornament-left.webp"
              ratio={[664, 341]}
              className="left-[-6%] top-1/2 w-[min(42vw,520px)] -translate-y-1/2 max-md:w-[70vw] max-md:opacity-50"
              imgClassName="opacity-70"
            />
            <Ornament
              src="/contact-ornament-right.webp"
              ratio={[663, 340]}
              className="right-[-6%] top-1/2 w-[min(42vw,520px)] -translate-y-1/2 max-md:hidden"
              imgClassName="opacity-70"
            />
            <div className="md:col-span-3">
              <Bracket>Unduh</Bracket>
            </div>
            <div className="md:col-span-8 md:col-start-5">
              <Heading id="resume-download">
                Versi lengkap
                <br />
                dalam satu berkas
              </Heading>
              <div data-anim="fade" className="mt-12 md:ml-[10%]">
                <CtaButton inline href="/resume.pdf" label="Unduh resume" />
              </div>
            </div>
          </section>

          <footer className="mt-28 flex flex-col justify-between gap-1 font-switzer text-[12px] text-white/40 sm:flex-row">
            <p>Afrian Pryo Sulistyanno</p>
            <p>Resume 2026</p>
          </footer>
        </ResumeMotion>
      </main>
    </>
  );
}