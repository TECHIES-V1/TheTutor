"use client";

import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[130vh] flex flex-col items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://private-us-east-1.manuscdn.com/sessionFile/04xiDSXumUnVVnmcgXVD8w/sandbox/OEMhx6Yg8VjcPst4RAtBX6-img-2_1771631424000_na1fn_aGVyby10ZWNoLXBhdHRlcm4.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background/50"></div>
      </div>

      <div className="container relative z-10 text-center max-w-5xl mx-auto px-4 mt-20 mb-[10rem]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center gap-2 mb-10 px-5 py-2.5 bg-secondary/10 border border-secondary/20 rounded-full backdrop-blur-sm"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-secondary">
            Powered by Amazon Nova AI
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="font-playfair text-6xl md:text-8xl lg:text-[7.5rem] font-bold mb-10 leading-[1.1] tracking-tight"
        >
          Learn Anything, <br className="hidden md:block" />
          <span className="relative inline-block mt-4">
            <span className="relative bg-gradient-to-r from-primary via-[#FFF8D6] to-secondary bg-clip-text text-transparent">
              Personalized
            </span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed"
        >
          Experience AI-powered education that adapts to your pace, learning
          style, and goals. From curriculum generation to verified
          certificates—all personalized just for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-6 justify-center mb-24"
        >
          <Button
            asChild
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-[#E5C158] transition-all duration-300 px-12 py-8 text-xl group relative overflow-hidden"
          >
            <Link href="/auth/signin">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative z-10 flex items-center font-semibold">
                Start Learning Now
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary transition-all duration-300 px-12 py-8 text-xl backdrop-blur-sm font-medium"
          >
            Watch Demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-14 text-lg font-medium text-muted-foreground/90 mt-12 mb-[5rem]"
        >
          {[
            "AI-Powered Learning",
            "Verified Certificates",
            "Instant Feedback",
          ].map((text, i) => (
            <div
              key={i}
              className="flex items-center gap-3 hover:text-primary transition-colors duration-300 cursor-default group"
            >
              <CheckCircle2 className="w-6 h-6 text-primary transition-all" />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
    </section>
  );
}
