"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Adaptive Tutor Guidance",
    description: "The tutor responds based on your level and adjusts the pace as you progress.",
    image: "https://images.unsplash.com/photo-1584697964192-58c4f4bfc55a?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Structured Learning Plans",
    description: "Turn any topic into a clear curriculum with milestones, checkpoints, and revision cycles.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Feedback In Seconds",
    description: "Ask questions, practice, and get immediate explanations without waiting for office hours.",
    image: "https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Certificate Ready Learning",
    description: "Build confidence for exams and portfolio outcomes with trackable completion and proof.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden border-y border-border/80 bg-background py-20 md:py-28">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">What You Get</p>
          <h2 className="mt-3 text-4xl font-bold text-foreground md:text-5xl">A Tutor Experience Built Around You</h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
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
              className="neo-surface overflow-hidden rounded-3xl"
            >
              <img src={feature.image} alt={feature.title} className="h-52 w-full object-cover" />
              <div className="p-6">
                <h3 className="font-playfair text-2xl font-bold text-primary">{feature.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
