"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "AI-Powered Personalization",
    description:
      "Amazon Nova adapts every lesson to your learning style, pace, and background knowledge.",
  },
  {
    title: "Comprehensive Curriculum",
    description:
      "From goal to mastery: structured modules, interactive lessons, and rigorous assessments.",
  },
  {
    title: "Instant Feedback",
    description:
      "Get real-time grading and actionable insights to accelerate your learning journey.",
  },
  {
    title: "Verified Certificates",
    description:
      "Earn publicly verifiable certificates that validate your expertise and commitment.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-24 md:py-32 relative bg-background border-y border-border/50 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full text-secondary text-sm font-medium">
            Discover
          </div>
          <h2 className="font-playfair text-4xl md:text-6xl font-bold mb-6 drop-shadow-md">
            Why Choose{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
              TheTutor?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the power of AI-driven personalized learning that adapts to
            your unique needs.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-10 bg-card/40 backdrop-blur-md border border-border/60 hover:border-primary/50 rounded-2xl transition-all duration-500 group hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-inner">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.6)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.8)] transition-all duration-500"></div>
              </div>

              <h3 className="font-playfair text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
