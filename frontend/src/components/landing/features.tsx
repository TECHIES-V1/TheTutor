"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const features = [
  {
    title: "Adaptive Tutor Guidance",
    description: "The tutor responds based on your level and adjusts the pace as you progress.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Structured Learning Plans",
    description: "Turn any topic into a clear curriculum with milestones, checkpoints, and revision cycles.",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Feedback In Seconds",
    description: "Ask questions, practice, and get immediate explanations without waiting for office hours.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Certificate Ready Learning",
    description: "Build confidence for exams and portfolio outcomes with trackable completion and proof.",
    image: "https://images.unsplash.com/photo-1522881193457-37ae97c905bf?auto=format&fit=crop&w=900&q=80",
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">What You Get</p>
          <h2 className="mt-3 text-4xl font-bold text-[#111111] md:text-5xl">A Tutor Experience Built Around You</h2>
          <p className="mt-4 text-base text-[#505050] md:text-lg">
            TheTutor combines guided conversation, clear structure, and fast response time so learning feels focused, not overwhelming.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="landing-surface overflow-hidden rounded-3xl"
            >
              <div className="relative h-52 w-full">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-playfair text-2xl font-bold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
