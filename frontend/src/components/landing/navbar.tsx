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
      <nav className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-[rgba(212,175,55,0.28)] bg-[rgba(245,249,255,0.92)] px-3 py-2.5 shadow-[0_10px_35px_rgba(27,45,79,0.14)] backdrop-blur-md transition-all duration-300 sm:px-4 sm:py-3">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="TheTutor" className="h-8 w-8 rounded-lg object-contain sm:h-10 sm:w-10 sm:rounded-xl" />
            <div>
              <p className="font-playfair text-base font-bold text-[#1E3A7A] sm:text-xl">TheTutor</p>
              <p className="hidden text-[10px] uppercase tracking-[0.14em] text-[#4a6490] sm:block">AI Learning Coach</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="motion-link rounded-full px-3 py-1.5 text-sm font-semibold text-[#4a6490] hover:bg-[#eaf2ff] hover:text-[#1E3A7A]"
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              size="sm"
              className="motion-press rounded-full border border-[#c1d4ef] bg-[#f7fbff] px-4 text-[#1E3A7A] hover:bg-[#eaf2ff]"
            >
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="landing-btn-primary rounded-full px-5"
            >
              <Link href="/auth/signin">Start Learning</Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="text-[#1E3A7A] hover:bg-[#eaf2ff] lg:hidden"
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
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[85vw] flex-col border-l border-[rgba(212,175,55,0.28)] bg-[rgba(245,249,255,0.97)] p-6 backdrop-blur-md sm:max-w-sm lg:hidden"
            >
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="TheTutor" className="h-9 w-9 rounded-lg object-contain" />
                  <span className="font-playfair text-lg font-bold text-[#1E3A7A]">TheTutor</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-[#4a6490] hover:bg-[#eaf2ff] hover:text-[#1E3A7A]"
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
                    className="border-b border-[rgba(212,175,55,0.22)] pb-4 text-base font-semibold text-[#4a6490] transition-colors hover:text-[#1E3A7A]"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <Button
                asChild
                size="lg"
                className="landing-btn-primary mt-8 rounded-full"
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
