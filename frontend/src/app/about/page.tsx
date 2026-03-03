import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#101010]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-3xl rounded-3xl p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">About</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[#111111] md:text-5xl">
            TheTutor
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#4c4c4c]">
            TheTutor helps adults learn with structured AI-guided curricula, practical exercises,
            quizzes, and progress tracking. We are focused on making high-quality learning
            accessible, practical, and measurable.
          </p>
          <p className="mt-4 text-sm text-[#5f5f5f]">
            Looking for details about policy or support? Visit{" "}
            <Link href="/privacy" className="text-[#8a6a09] underline-offset-4 hover:underline">
              Privacy
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-[#8a6a09] underline-offset-4 hover:underline">
              Contact
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
