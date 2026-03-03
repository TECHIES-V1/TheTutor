"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden border-y border-[#d4af37]/25 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] to-[#121212]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-15" />

      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="landing-surface mx-auto max-w-4xl rounded-3xl p-8 backdrop-blur-md md:p-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">Ready To Begin</p>
          <h2 className="mt-3 text-4xl font-bold text-[#111111] md:text-5xl">Build A Personalized Study Path Today</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#4f4f4f] md:text-lg">
            Ask your first question, get a tailored plan, and keep learning with a tutor that adapts to you.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="landing-gold rounded-full px-8 hover:!opacity-100"
            >
              <Link href="/auth/signin">
                Start Learning
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="landing-outline rounded-full bg-transparent px-8"
            >
              Explore Features
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
