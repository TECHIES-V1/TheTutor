"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="py-24 md:py-36 relative bg-gradient-to-br from-background via-card/50 to-background border-y border-border/60 overflow-hidden">
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"
      />

      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-background/40 backdrop-blur-xl border border-primary/20 rounded-3xl p-10 md:p-16 shadow-[0_0_50px_rgba(212,175,55,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight drop-shadow-sm">
            Ready to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Transform
            </span>{" "}
            Your Learning?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of learners who are discovering the power of
            AI-personalized education. Start your journey today with a free
            learning assessment.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-[#E5C158] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300 px-10 py-7 text-lg group relative border border-primary/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative z-10 flex items-center font-semibold">
                Begin Your Journey
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary/40 text-foreground hover:bg-primary/5 hover:border-primary border hover:shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all duration-300 px-10 py-7 text-lg backdrop-blur-sm"
            >
              Learn More
            </Button>
          </div>

          <div className="mt-16 pt-12 border-t border-border/50 bg-background/30 -mx-10 md:-mx-16 -mb-10 md:-mb-16 px-10 py-12 md:py-16">
            <p className="text-sm uppercase tracking-widest font-semibold text-muted-foreground mb-8">
              Trusted by learners worldwide
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-16">
              <div className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-[#FFF8D6] mb-2 drop-shadow-[0_0_10px_rgba(212,175,55,0.6)] group-hover:scale-110 transition-transform duration-300">
                  10K+
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Active Learners
                </div>
              </div>

              <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent"></div>

              <div className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-[#FFF8D6] mb-2 drop-shadow-[0_0_10px_rgba(212,175,55,0.6)] group-hover:scale-110 transition-transform duration-300">
                  500+
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Subjects Taught
                </div>
              </div>

              <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent"></div>

              <div className="text-center group cursor-default">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-[#FFF8D6] mb-2 drop-shadow-[0_0_10px_rgba(212,175,55,0.6)] group-hover:scale-110 transition-transform duration-300">
                  4.9★
                </div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Average Rating
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
