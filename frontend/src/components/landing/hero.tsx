"use client";

import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Iridescence } from "./iridescence";

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

      <div className="container relative z-10 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-left"
        >
          <div className="landing-inset inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em]">
            AI Tutor
            <span className="rounded-full bg-[#d4af37]/20 px-2 py-0.5 text-[#8a6a09]">Personalized</span>
          </div>

          <h1 className="mt-6 text-balance font-playfair text-4xl font-bold leading-tight text-[#1E3A7A] sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            Learn Smarter With
            <span className="block text-[#1E3A7A]">
              TheTutor
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#4a6490] md:text-xl lg:mx-0">
            Build a learning plan that fits your pace, your goals, and your schedule. Get tutor guidance, structured modules, and instant feedback in one clean, calm learning workspace.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button asChild size="lg" className="motion-press landing-btn-primary rounded-full px-8">
              <Link href="/auth/signin">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              disabled
              className="motion-press rounded-full border border-[#c1d4ef] bg-[#f7fbff] px-8 text-[#1E3A7A] opacity-60 hover:bg-[#eaf2ff]"
              title="Demo coming soon"
            >
              <PlayCircle className="mr-2 h-5 w-5 text-[#d4af37]" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-3 text-sm text-[#525252] sm:grid-cols-3">
            {["Adaptive paths", "Live feedback", "Course certificates"].map((item) => (
              <div key={item} className="landing-inset motion-card flex items-center justify-center gap-2 rounded-xl px-3 py-2 lg:justify-start">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#d4af37]" />
                <span className="font-medium text-xs sm:text-sm">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="-mr-8 hidden lg:block sm:-mr-16 lg:-mr-28"
        >
          <div className="neo-surface h-[32rem] rounded-3xl ring-1 ring-[#d4af37]/20" />
        </motion.div>
      </div>
    </section>
  );
}
