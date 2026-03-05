"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import Grainient from "./Grainient";

export function CTA() {
  return (
    <section id="cta" className="neu-shell relative overflow-hidden border-y border-[#d4af37]/25 py-20 md:py-28">
      <div className="container relative z-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">

          {/* Left — Grainient card with content */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl ring-1 ring-[#d4af37]/30"
          >
            {/* Grainient background */}
            <div className="pointer-events-none absolute inset-0">
              <Grainient
                color1="#eef5ff"
                color2="#1f4ea3"
                color3="#f4c542"
                timeSpeed={0.25}
                colorBalance={0}
                warpStrength={1}
                warpFrequency={5}
                warpSpeed={2}
                warpAmplitude={50}
                blendAngle={0}
                blendSoftness={0.05}
                rotationAmount={500}
                noiseScale={2}
                grainAmount={0.1}
                grainScale={2}
                grainAnimated={false}
                contrast={1.35}
                gamma={1}
                saturation={0.9}
                centerX={0}
                centerY={0}
                zoom={0.9}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[#0f2244]/45" />

            {/* Content */}
            <div className="relative z-10 p-8 md:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffe08a]">Ready To Begin</p>
              <h2 className="mt-3 text-4xl font-bold text-white md:text-5xl">Build A Personalized Study Path Today</h2>
              <p className="mt-4 max-w-xl text-base text-white/80 md:text-lg">
                Ask your first question, get a tailored plan, and keep learning with a tutor that adapts to you.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white px-8 font-semibold text-[#1E3A7A] shadow-none hover:bg-[#e6efff]"
                >
                  <Link href="/auth/signin">
                    Start Learning
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="rounded-full border-2 border-white/80 bg-white/15 px-8 text-white backdrop-blur-sm hover:bg-white/25 hover:text-white"
                >
                  <a href="#features">Explore Features</a>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right — blank decorative box that overflows */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="-mr-8 hidden lg:block sm:-mr-16 lg:-mr-28"
          >
            <div className="neo-surface h-full min-h-[22rem] rounded-3xl ring-1 ring-[#d4af37]/20" />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
