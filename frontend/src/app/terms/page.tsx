import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
  title: "Terms of Service",
  description:
    "TheTutor terms of service - Understand your rights and responsibilities when using our AI-powered learning platform.",
  keywords: ["terms of service", "terms and conditions", "user agreement"],
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#101010]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-4xl rounded-3xl p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">Terms</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[#111111] md:text-5xl">
            Terms of Use
          </h1>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-[#4c4c4c]">
            <p>
              By using TheTutor, you agree to use the platform responsibly and comply with
              applicable laws and academic integrity requirements.
            </p>
            <p>
              Course content is generated to support learning and should be reviewed critically,
              especially for high-stakes assessments.
            </p>
            <p>
              We may update these terms over time. Continued use after updates means you accept
              the revised terms.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
