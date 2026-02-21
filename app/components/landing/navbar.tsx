"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-[0_4px_30px_rgba(212,175,55,0.05)]"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <span className="text-primary-foreground font-playfair font-bold text-lg">
                T
              </span>
            </div>
            <span className="font-playfair text-xl font-bold text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
              TheTutor
            </span>
          </div>

          {/* Desktop Menu (> 1300px) */}
          <div className="hidden min-[1300px]:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm hover:text-primary transition-colors hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm hover:text-primary transition-colors hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
            >
              How It Works
            </a>
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:shadow-[0_0_25px_rgba(212,175,55,0.7)]"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button (<= 1300px) */}
          <div className="min-[1300px]:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 min-[1300px]:hidden"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-card border-l border-border z-50 flex flex-col p-6 min-[1300px]:hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                    <span className="text-primary-foreground font-playfair font-bold">
                      T
                    </span>
                  </div>
                  <span className="font-playfair text-lg font-bold text-primary">
                    TheTutor
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex flex-col gap-6 text-lg font-medium">
                <a
                  href="#features"
                  onClick={() => setIsSidebarOpen(false)}
                  className="hover:text-primary transition-colors hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)] border-b border-border/50 pb-4"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setIsSidebarOpen(false)}
                  className="hover:text-primary transition-colors hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.5)] border-b border-border/50 pb-4"
                >
                  How It Works
                </a>
                <Button
                  size="lg"
                  className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
