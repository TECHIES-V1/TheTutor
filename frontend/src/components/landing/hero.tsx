"use client";

import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Iridescence } from "./iridescence";

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    alt: "Adult professional learning from a laptop and notes",
  },
  {
    src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
    alt: "Adult learners in a collaborative workshop",
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    alt: "Team of adults studying and discussing materials",
  },
];

export function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
      <div className="pointer-events-none absolute inset-0">
        <Iridescence
          className="h-full w-full"
          color={[1, 1, 1]}
          speed={0.9}
          amplitude={0.065}
          mouseReact
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.76),rgba(255,255,255,0.54)_38%,rgba(255,255,255,0.22)_62%,rgba(255,255,255,0)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/62 via-white/18 to-transparent" />

      <div className="container relative z-10 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-left"
        >
          <div className="landing-inset inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1a1a1a]">
            AI Tutor
            <span className="rounded-full bg-[#d4af37]/20 px-2 py-0.5 text-[#8a6a09]">Personalized</span>
          </div>

          <h1 className="mt-6 text-balance font-playfair text-3xl font-bold leading-tight text-[#1a1a1a] md:text-6xl lg:text-[3.25rem]">
            Learn Smarter With
            <span className="block text-[#1a1a1a]">
              TheTutor
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#333333] md:text-xl lg:mx-0">
            Build a learning plan that fits your pace, your goals, and your schedule. Learn with tutor guidance, structured modules, and instant feedback in one clean, calm learning workspace.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="motion-press landing-gold rounded-full px-8 hover:!opacity-100">
              <Link href="/auth/signin">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled
              className="motion-press landing-outline rounded-full px-8 opacity-60"
              title="Demo coming soon"
            >
              <PlayCircle className="mr-2 h-5 w-5 text-[#8a6a09]" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-3 text-sm text-[#333333] sm:grid-cols-3">
            {["Adaptive paths", "Live feedback", "Course certificates"].map((item) => (
              <div key={item} className="landing-inset motion-card flex items-center justify-center gap-2 rounded-xl px-3 py-2 lg:justify-start">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#b48b1d]" />
                <span className="font-medium text-xs sm:text-sm">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <article className="landing-surface motion-card col-span-2 overflow-hidden rounded-3xl ring-1 ring-[#c9a227] sm:col-span-1 sm:row-span-2">
              <div className="relative h-48 sm:h-full sm:min-h-[26rem]">
                <Image
                  src={heroImages[0].src}
                  alt={heroImages[0].alt}
                  fill
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </article>
            <article className="landing-surface motion-card overflow-hidden rounded-3xl ring-1 ring-[#c9a227]">
              <div className="relative h-28 sm:h-52">
                <Image
                  src={heroImages[1].src}
                  alt={heroImages[1].alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 50vw, 50vw"
                  className="object-cover"
                />
              </div>
            </article>
            <article className="landing-surface motion-card overflow-hidden rounded-3xl ring-1 ring-[#c9a227]">
              <div className="relative h-28 sm:h-52">
                <Image
                  src={heroImages[2].src}
                  alt={heroImages[2].alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 50vw, 50vw"
                  className="object-cover"
                />
              </div>
            </article>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
