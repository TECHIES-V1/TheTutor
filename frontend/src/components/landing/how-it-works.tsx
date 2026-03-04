"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { BookOpen, Brain, CheckCircle2, Award, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";

const phases = [
  {
    step: "01",
    title: "Set Your Goal",
    description: "Tell the tutor what you want to learn and your current confidence level.",
    icon: Brain,
  },
  {
    step: "02",
    title: "Get A Smart Plan",
    description: "Receive focused modules and weekly targets built around your availability.",
    icon: BookOpen,
  },
  {
    step: "03",
    title: "Practice Daily",
    description: "Learn in chat with instant guidance, examples, and corrective feedback.",
    icon: CheckCircle2,
  },
  {
    step: "04",
    title: "Track Progress",
    description: "See completed milestones and finish with a certificate-ready summary.",
    icon: Award,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white py-20 md:py-28">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">How It Works</p>
          <h2 className="mt-3 text-4xl font-bold text-[#111111] md:text-5xl">Four Steps, Clear Results</h2>
          <p className="mt-4 text-base text-[#505050] md:text-lg">
            The workflow is simple on purpose: less confusion, better consistency, and faster momentum.
          </p>
        </motion.div>

        <div className="flex flex-col items-stretch xl:flex-row xl:items-start">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <React.Fragment key={phase.title}>
                <motion.article
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-70px" }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="landing-surface rounded-3xl p-6 xl:flex-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="landing-gold flex h-12 w-12 items-center justify-center rounded-xl">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-bold text-[#b48b1d]/70">{phase.step}</span>
                  </div>
                  <h3 className="mt-5 font-playfair text-2xl font-bold text-[#111111]">{phase.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#505050]">{phase.description}</p>
                </motion.article>

                {index < phases.length - 1 && (
                  <div className="flex shrink-0 items-center justify-center py-3 xl:self-center xl:px-3 xl:py-0">
                    <ChevronDown className="h-6 w-6 text-[#d4af37]/50 xl:hidden" />
                    <ChevronRight className="hidden h-6 w-6 text-[#d4af37]/50 xl:block" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="landing-surface mt-12 overflow-hidden rounded-3xl"
        >
          <div className="relative h-56 w-full sm:h-72">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80"
              alt="Adult learners collaborating in a study session"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
