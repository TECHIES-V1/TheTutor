import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#101010]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-4xl rounded-3xl p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">Privacy</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[#111111] md:text-5xl">
            Privacy Notice
          </h1>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#4c4c4c]">
            <p>
              We collect account and usage data needed to provide personalized learning experiences,
              course generation, and progress tracking.
            </p>
            <p>
              We use this data to improve learning quality, reliability, and security. We do not
              sell personal data.
            </p>
            <p>
              If you need data export or deletion support, contact{" "}
              <a href="mailto:support@thetutor.ai" className="text-[#8a6a09] underline-offset-4 hover:underline">
                support@thetutor.ai
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
