"use client";

import { motion } from "framer-motion";
import { BookOpen, Brain, CheckCircle2, Award } from "lucide-react";

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
    <section id="how-it-works" className="relative overflow-hidden bg-background py-20 md:py-28">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">How It Works</p>
          <h2 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">Four Steps, Clear Results</h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            The workflow is simple on purpose: less confusion, better consistency, and faster momentum.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <motion.article
                key={phase.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-70px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="neo-surface rounded-3xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="skeuo-gold flex h-12 w-12 items-center justify-center rounded-xl">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-bold text-primary/60">{phase.step}</span>
              </div>
              <h3 className="mt-5 font-playfair text-2xl font-bold text-primary">{phase.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{phase.description}</p>
            </motion.article>
          );
        })}
      </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="neo-surface mt-12 overflow-hidden rounded-3xl"
        >
          <img
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1400&q=80"
            alt="Students learning together with books and laptops"
            className="h-56 w-full object-cover sm:h-72"
          />
        </motion.div>
      </div>
    </section>
  );
}
