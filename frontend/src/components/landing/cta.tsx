"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { Iridescence } from "./iridescence";

export function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden border-y border-[var(--landing-border-gold)] py-20 md:py-28">
      {/* Iridescence background with gold/brown tones */}
      <div className="pointer-events-none absolute inset-0">
        <Iridescence
          speed={0.6}
          amplitude={0.08}
          mouseReact={false}
          className="h-full w-full"
        />
      </div>

      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="landing-surface mx-auto max-w-4xl rounded-3xl p-8 backdrop-blur-md md:p-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ready To Begin</p>
            <h2 className="mt-3 text-[25px] font-bold text-[var(--landing-heading)] md:text-5xl text-balance leading-tight">Build A Personalized Study Path Today</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--landing-body)] md:text-[16px] text-[14px]">
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
              asChild
              variant="outline"
              size="lg"
              className="landing-outline rounded-full bg-transparent px-8"
            >
              <a href="#features">Explore Features</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
