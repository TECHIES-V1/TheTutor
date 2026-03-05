"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Adaptive Tutor Guidance",
    description: "The tutor responds based on your level and adjusts the pace as you progress.",
  },
  {
    title: "Structured Learning Plans",
    description: "Turn any topic into a clear curriculum with milestones, checkpoints, and revision cycles.",
  },
  {
    title: "Feedback In Seconds",
    description: "Ask questions, practice, and get immediate explanations without waiting for office hours.",
  },
  {
    title: "Certificate Ready Learning",
    description: "Build confidence for exams and portfolio outcomes with trackable completion and proof.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden border-y border-[rgba(212,175,55,0.22)] bg-[#f0f6ff] py-20 md:py-28">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d4af37]">What You Get</p>
          <h2 className="mt-3 text-4xl font-bold text-[#1E3A7A] md:text-5xl">A Tutor Experience Built Around You</h2>
          <p className="mt-4 text-base text-[#4a6490] md:text-lg">
            TheTutor combines guided conversation, clear structure, and fast response time so learning feels focused, not overwhelming.
          </p>
        </motion.div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Left — empty decorative box that overflows */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="-ml-8 hidden lg:block sm:-ml-16 lg:-ml-28"
          >
            <div className="neo-surface h-full min-h-[28rem] rounded-3xl ring-1 ring-[#d4af37]/20" />
          </motion.div>

          {/* Right — bento of feature cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="neo-surface rounded-3xl p-6"
              >
                <h3 className="font-playfair text-xl font-bold text-[#1E3A7A]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4a6490]">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
