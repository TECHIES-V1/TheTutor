"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
];

export function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/92 shadow-[0_10px_30px_-22px_rgba(17,17,17,0.35)] backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="TheTutor"
              className="h-8 w-8 rounded-lg object-contain"
            />
            <p className="font-playfair text-base font-bold text-[#1a1a1a] sm:text-lg">
              TheTutor
            </p>
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-[#333333] transition-all hover:bg-[#f0f0ee] hover:text-[#b48b1d]"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex">
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
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-8 w-8 rounded-full text-[#1a1a1a] hover:bg-[#f0f0ee] hover:text-[#8a6a09] md:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isSidebarOpen ? "close" : "open"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </Button>
        </motion.div>
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
              className="fixed inset-0 z-50 md:hidden"
              aria-label="Close menu"
            />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-4 right-4 top-[4.5rem] z-50 mx-auto max-w-3xl rounded-2xl border-[1.5px] border-[#c9a227] bg-[#fafaf8]/95 p-5 shadow-[6px_6px_14px_rgba(200,200,195,0.45),-6px_-6px_14px_rgba(255,255,255,0.7)] backdrop-blur-xl md:hidden"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-[#333333] transition-all hover:bg-[#f0f0ee] hover:text-[#b48b1d]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mt-3 border-t border-[#c9a227]/30 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="landing-gold w-full rounded-full hover:!opacity-100"
                >
                  <Link
                    href="/auth/signin"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    Start Learning
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
