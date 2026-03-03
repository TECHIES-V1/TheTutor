"use client";

import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Iridescence } from "./iridescence";

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80",
    alt: "Student taking notes while learning online",
  },
  {
    src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    alt: "Tutor helping students with a lesson",
  },
  {
    src: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80",
    alt: "Learner reviewing study materials",
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
          amplitude={0.09}
          mouseReact
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.9)_55%,rgba(255,249,231,0.88)_100%)]" />

      <div className="container relative z-10 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing-inset inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#111111]">
            AI Tutor
            <span className="rounded-full bg-[#d4af37]/20 px-2 py-0.5 text-[#8a6a09]">Personalized</span>
          </div>

          <h1 className="mt-6 text-balance font-playfair text-5xl font-bold leading-tight text-[#111111] md:text-6xl lg:text-[4.25rem]">
            Learn Smarter With
            <span className="block bg-gradient-to-r from-[#101010] via-[#2a2a2a] to-[#b48b1d] bg-clip-text text-transparent">
              TheTutor
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#3f3f3f] md:text-xl">
            Build a learning plan that fits your pace, your goals, and your schedule. Get tutor guidance, structured modules, and instant feedback in one clean, calm learning workspace.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="motion-press landing-gold rounded-full px-8 hover:!opacity-100">
              <Link href="/auth/signin">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="motion-press landing-outline rounded-full px-8"
            >
              <PlayCircle className="mr-2 h-5 w-5 text-[#8a6a09]" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-9 grid gap-3 text-sm text-[#525252] sm:grid-cols-3">
            {["Adaptive paths", "Live feedback", "Skill certificates"].map((item) => (
              <div key={item} className="landing-inset motion-card flex items-center gap-2 rounded-xl px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-[#b48b1d]" />
                <span className="font-medium">{item}</span>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="landing-surface motion-card overflow-hidden rounded-3xl sm:row-span-2 ring-1 ring-[#d4af37]/20">
              <img src={heroImages[0].src} alt={heroImages[0].alt} className="h-full w-full object-cover" />
            </article>
            <article className="landing-surface motion-card overflow-hidden rounded-3xl ring-1 ring-[#d4af37]/20">
              <img src={heroImages[1].src} alt={heroImages[1].alt} className="h-full w-full object-cover" />
            </article>
            <article className="landing-surface motion-card overflow-hidden rounded-3xl ring-1 ring-[#d4af37]/20">
              <img src={heroImages[2].src} alt={heroImages[2].alt} className="h-full w-full object-cover" />
            </article>
          </div>
          <div className="landing-surface absolute -bottom-5 -left-4 rounded-2xl px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#5a5a5a]">Learners onboard</p>
            <p className="mt-1 text-xl font-bold text-[#111111]">12,000+</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
