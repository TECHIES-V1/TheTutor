import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-[#101010]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-3xl rounded-3xl p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">Contact</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[#111111] md:text-5xl">
            Get In Touch
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[#4c4c4c]">
            For support, partnerships, or product questions, email:
          </p>
          <a
            href="mailto:support@thetutor.ai"
            className="mt-4 inline-flex rounded-full border border-[#d4af37]/35 bg-[#f9f4e0] px-4 py-2 text-sm font-semibold text-[#8a6a09]"
          >
            support@thetutor.ai
          </a>
          <p className="mt-6 text-sm text-[#5f5f5f]">
            We typically respond within 1-2 business days.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
