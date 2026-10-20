import Hero from "@/components/Hero";
import About from "@/components/About";
import Works from "@/components/Works";
import Contact from "@/components/Contact";

export default function Home() {
  return (
    <main className="flex flex-col gap-[clamp(120px,20vh,240px)]">
      <Hero />
      <About />
      <Works />
      <Contact />
    </main>
  );
}