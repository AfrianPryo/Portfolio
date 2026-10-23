import type { Metadata } from "next";
import Hero from "@/components/Hero";
import About from "@/components/About";
import ExperienceArtDirection from "@/components/ExperienceArtDirection";
import Skills from "@/components/Skills";
import Works from "@/components/Works";
import Contact from "@/components/Contact";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="flex flex-col gap-[clamp(120px,20vh,240px)]">
      <Hero />
      <About />
      <ExperienceArtDirection />
      <Skills />
      <Works />
      <Contact />
    </main>
  );
}