import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/lib/projects";
import CtaButton from "@/components/CtaButton";
import ResumeMotion from "@/components/ResumeMotion";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

const categoryLabels = {
  website: "Website",
  design: "Design",
  art: "Art",
} as const;

export function generateStaticParams() {
  return PROJECTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((item) => item.slug === slug);

  if (!project) {
    return { title: "Proyek tidak ditemukan — Afrian" };
  }

  return {
    title: `${project.title} — Afrian`,
    description: project.description,
    alternates: {
      canonical: `/works/${project.slug}`,
    },
    openGraph: {
      type: "website",
      url: `/works/${project.slug}`,
      title: `${project.title} — Portofolio Afrian`,
      description: project.description,
      ...(project.slides?.[0]
        ? {
            images: [
              {
                url: project.slides[0].src,
                alt: `Pratinjau proyek ${project.title}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — Portofolio Afrian`,
      description: project.description,
      ...(project.slides?.[0]
        ? { images: [project.slides[0].src] }
        : {}),
    },
  };
}

/* Label kecil bergaya [ Teks ], sama seperti page Resume */
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

/* Ornamen latar di belakang konten, tepi di-feather agar tidak terpotong */
function Ornament({
  src,
  ratio,
  className = "",
  imgClassName = "",
}: {
  src: string;
  ratio: [number, number];
  className?: string;
  imgClassName?: string;
}) {
  const mask =
    "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)";
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

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = PROJECTS.find((item) => item.slug === slug);

  if (!project) notFound();
  const preview = project.slides?.[0] ?? project.gallery?.[0];
  if (!preview) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-[4vw] pb-16 pt-8 text-white max-sm:px-5 max-sm:pt-6">
      {/* Latar halaman: cahaya merah tipis dari atas + noise, sama dengan Resume */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_38%_at_50%_0%,rgba(255,34,0,0.16),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[url('/noise.png')] opacity-[0.07] mix-blend-screen"
      />

      <ResumeMotion className="relative isolate z-10 mx-auto max-w-[1360px]">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="Kembali ke beranda"
            className="block w-[clamp(96px,9.65vw,140px)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={1217}
              height={431}
              priority
              className="h-auto w-full brightness-0 invert"
            />
          </Link>
          <Link
            href="/#works"
            className="font-switzer text-[12px] font-bold uppercase tracking-[0.02em] text-white underline decoration-[1.5px] underline-offset-[5px] transition-colors hover:text-flame focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Kembali ke karya
          </Link>
        </header>

        {/* ===== Judul ===== */}
        <section
          data-group
          className="relative mt-24 grid gap-y-10 md:mt-36 md:grid-cols-12"
        >
          <Ornament
            src="/resume-tribal.webp"
            ratio={[1609, 707]}
            className="left-1/2 top-[-30%] w-[min(120vw,1500px)] -translate-x-1/2"
            imgClassName="opacity-30 drop-shadow-[0_0_70px_rgba(255,34,0,0.25)]"
          />
          <div className="md:col-span-3">
            <Bracket>{categoryLabels[project.category]}</Bracket>
          </div>
          <div className="md:col-span-9">
            <h1
              data-anim="title"
              className="font-acerok text-[clamp(44px,8.5vw,120px)] font-normal uppercase leading-[0.9] tracking-[0.01em] text-flame max-sm:text-[clamp(34px,10vw,52px)]"
            >
              {project.title}
            </h1>
            <p
              data-anim="lines"
              className="mt-12 max-w-[360px] font-switzer text-[14px] leading-[1.25] tracking-[-0.01em] text-white/75 [text-indent:2.4em] md:ml-[10%] md:mt-16"
            >
              {project.description}
            </p>
          </div>
        </section>

        {/* ===== Pratinjau ===== */}
        <div className="relative mt-20 aspect-[16/10] overflow-hidden bg-[#0a0303] max-sm:mt-14 md:mt-28">
          <Image
            src={preview.src}
            alt={`Pratinjau ${project.title}`}
            fill
            priority
            sizes="(max-width: 768px) 92vw, 1280px"
            className="object-cover"
          />
        </div>

        {/* ===== Lanjut ===== */}
        <section
          data-group
          className="relative mt-28 grid gap-y-8 max-sm:mt-20 md:mt-40 md:grid-cols-12"
        >
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
            <Bracket>Berikutnya</Bracket>
          </div>
          <div className="md:col-span-8 md:col-start-5">
            <h2
              data-anim="title"
              className="font-acerok text-[clamp(30px,4.3vw,68px)] font-normal uppercase leading-[1.05] tracking-[0.01em] text-flame"
            >
              Lihat karya
              <br />
              yang lain
            </h2>
            <div data-anim="fade" className="mt-12 md:ml-[10%]">
              <CtaButton inline href="/#works" label="Jelajahi proyek" />
            </div>
          </div>
        </section>

        <footer className="mt-28 flex flex-col justify-between gap-1 font-switzer text-[12px] text-white/40 sm:flex-row">
          <p>Afrian Pryo Sulistyanno</p>
          <p>Portofolio 2026</p>
        </footer>
      </ResumeMotion>
    </main>
  );
}