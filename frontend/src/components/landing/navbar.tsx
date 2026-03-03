"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { TutorAvatarMark } from "@/components/brand/TutorAvatarMark";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "border-b border-[#d4af37]/35 bg-white/95 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <TutorAvatarMark size={40} className="rounded-xl" />
            <div>
              <p className="font-playfair text-xl font-bold text-[#111111]">TheTutor</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#595959]">AI Learning Coach</p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-[#525252] transition-colors hover:text-[#b48b1d]"
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              size="sm"
              className="landing-gold rounded-full px-5 hover:!opacity-100"
            >
              <Link href="/auth/signin">Start Learning</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="text-[#111111] hover:bg-[#d4af37]/15 hover:text-[#8a6a09] lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              aria-label="Close menu"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="landing-surface fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col border-l border-[#d4af37]/35 p-6 lg:hidden"
            >
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TutorAvatarMark size={36} className="rounded-lg" />
                  <span className="font-playfair text-lg font-bold text-[#111111]">TheTutor</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-[#595959] hover:bg-[#d4af37]/15 hover:text-[#8a6a09]"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="flex flex-col gap-5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className="border-b border-[#d4af37]/25 pb-4 text-base font-semibold text-[#525252] transition-colors hover:text-[#b48b1d]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <Button
                asChild
                size="lg"
                className="landing-gold mt-8 rounded-full hover:!opacity-100"
              >
                <Link href="/auth/signin" onClick={() => setIsSidebarOpen(false)}>
                  Start Learning
                </Link>
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
