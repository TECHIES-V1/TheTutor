import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
  title: "Contact Us",
  description:
    "Get in touch with TheTutor for support, partnerships, or product questions. We typically respond within 1-2 business days.",
  keywords: ["contact", "support", "help", "customer service"],
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-body)]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-4xl rounded-3xl p-6 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Contact</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[var(--landing-heading)] md:text-5xl">
            Get In Touch
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--landing-body)]">
            We welcome questions, feedback, and partnership conversations. If you need help with your
            account, courses, or platform behavior, our team is available by email.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="landing-inset rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">General Support</p>
              <a
                href="mailto:support@thetutor.ai"
                className="mt-2 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                support@thetutor.ai
              </a>
              <p className="mt-2 text-xs text-[var(--landing-secondary)]">Account, course, and product support.</p>
            </div>
            <div className="landing-inset rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Partnerships</p>
              <a
                href="mailto:partnerships@thetutor.ai"
                className="mt-2 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                partnerships@thetutor.ai
              </a>
              <p className="mt-2 text-xs text-[var(--landing-secondary)]">Collaboration, institutional, and strategic inquiries.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm leading-relaxed text-[var(--landing-body)]">
            <p>
              <span className="font-semibold text-[var(--landing-heading)]">Response Time:</span> We typically respond within
              1-2 business days.
            </p>
            <p>
              <span className="font-semibold text-[var(--landing-heading)]">Security Reports:</span> If you discover a potential
              security issue, please email <a href="mailto:security@thetutor.ai" className="text-primary underline-offset-4 hover:underline">security@thetutor.ai</a> with details.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
