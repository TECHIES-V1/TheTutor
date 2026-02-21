"use client";

import { motion } from "framer-motion";
import {
  Zap,
  BookOpen,
  Award,
  Brain,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const phases = [
  {
    number: "01",
    title: "Subject Clarification",
    description:
      "State your learning goal and let our AI clarify your intent with intelligent questions.",
    icon: Brain,
  },
  {
    number: "02",
    title: "Curriculum Generation",
    description:
      "Receive a personalized 5-8 module curriculum tailored to your level and pace.",
    icon: BookOpen,
  },
  {
    number: "03",
    title: "Lesson Content",
    description:
      "Get expertly-crafted lessons with video references and real-world examples.",
    icon: Sparkles,
  },
  {
    number: "04",
    title: "Assessment & Grading",
    description:
      "Complete interactive quizzes with AI-powered feedback and instant grading.",
    icon: CheckCircle2,
  },
  {
    number: "05",
    title: "Final Exam",
    description:
      "Synthesize your learning with a comprehensive final assessment.",
    icon: Award,
  },
  {
    number: "06",
    title: "Certificate",
    description: "Earn a verifiable, downloadable certificate of completion.",
    icon: Zap,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 relative bg-background/50 overflow-hidden"
    >
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium">
            Process
          </div>
          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Your Learning Journey
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Six powerful phases designed to take you from goal to mastery with
            AI guidance at every step.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative group h-full"
              >
                {index % 3 !== 2 && index < phases.length - 1 && (
                  <div className="hidden lg:block absolute top-[4.5rem] left-[calc(100%-2rem)] w-[calc(100%+4rem)] h-[2px] bg-gradient-to-r from-primary/30 via-secondary/20 to-transparent pointer-events-none z-0"></div>
                )}

                {index % 2 !== 1 && index < phases.length - 1 && (
                  <div className="hidden md:block lg:hidden absolute top-[4.5rem] left-[calc(100%-2rem)] w-[calc(100%+4rem)] h-[2px] bg-gradient-to-r from-primary/30 via-secondary/20 to-transparent pointer-events-none z-0"></div>
                )}

                <div className="p-8 pb-10 bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl hover:border-primary/50 transition-all duration-500 h-full relative z-10 flex flex-col hover:shadow-[0_15px_30px_rgba(212,175,55,0.1)] hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(212,175,55,0.4)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.7)]">
                      <Icon className="w-7 h-7 text-primary-foreground drop-shadow-sm" />
                    </div>

                    <div className="text-5xl font-playfair font-bold text-primary/10 transition-colors duration-500 group-hover:text-primary/30 tracking-tighter">
                      {phase.number}
                    </div>
                  </div>

                  <h3 className="font-playfair text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                    {phase.title}
                  </h3>
                  <p className="text-muted-foreground text-base leading-relaxed flex-grow">
                    {phase.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
