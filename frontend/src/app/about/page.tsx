import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#101010]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-4xl rounded-3xl p-6 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">About</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[#111111] md:text-5xl">
            TheTutor
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#4c4c4c]">
            TheTutor is an AI-supported learning platform designed to help learners turn broad goals
            into clear, structured progress. We combine guided course generation, practice-focused
            lessons, and continuous feedback so users can build real understanding, not just finish content.
          </p>

          <div className="mt-7 space-y-6 text-sm leading-relaxed text-[#4c4c4c]">
            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[#111111]">Our Mission</h5>
              <p className="mt-2">
                We believe high-quality learning should be practical, personalized, and measurable.
                TheTutor is built to help users learn with confidence by providing direction, feedback,
                and milestone-based progress across every stage of a course.
              </p>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[#111111]">What We Build</h5>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>AI-assisted course planning aligned to topic, level, and learning goals</li>
                <li>Lesson-by-lesson learning paths with quizzes and checkpoint assessments</li>
                <li>Progress tracking to help learners stay consistent and accountable</li>
                <li>Completion workflows and certification support for finished courses</li>
              </ul>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[#111111]">How We Work</h5>
              <p className="mt-2">
                We aim to ship with clarity and responsibility. That means improving reliability,
                being transparent about platform behavior, and iterating with user feedback to make
                the learning experience more useful over time.
              </p>
            </section>
          </div>

          <p className="mt-7 text-sm text-[#5f5f5f]">
            Looking for policy or support details? Visit{" "}
            <Link href="/privacy" className="text-[#8a6a09] underline-offset-4 hover:underline">
              Privacy
            </Link>
            ,{" "}
            <Link href="/terms" className="text-[#8a6a09] underline-offset-4 hover:underline">
              Terms
            </Link>
            , or{" "}
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
