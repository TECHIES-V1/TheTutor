import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
  title: "Privacy Policy",
  description:
    "TheTutor privacy policy - Learn how we collect, use, and protect your personal data and learning information.",
  keywords: ["privacy policy", "data protection", "user privacy"],
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-body)]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-5xl rounded-3xl p-6 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Privacy</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[var(--landing-heading)] md:text-5xl">
            Privacy Notice
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--landing-secondary)]">
            Last updated: March 4, 2026
          </p>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-[var(--landing-body)]">
            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[var(--landing-heading)]">Overview</h5>
              <p className="mt-2">
                This Privacy Notice explains what data TheTutor collects, how we use it, and the choices
                you have regarding your information when using our website and services.
              </p>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[var(--landing-heading)]">Information We Collect</h5>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Account data such as name, email address, and profile image</li>
                <li>Learning activity including course interactions, progress, and quiz responses</li>
                <li>Technical and device data used for security, diagnostics, and reliability</li>
                <li>Support communications and feedback you submit to us</li>
              </ul>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[var(--landing-heading)]">How We Use Information</h5>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Provide, maintain, and improve platform features</li>
                <li>Generate personalized learning experiences and content</li>
                <li>Track progress and support course completion workflows</li>
                <li>Detect abuse, enforce security controls, and prevent fraud</li>
                <li>Communicate service updates and respond to support requests</li>
              </ul>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[var(--landing-heading)]">Data Sharing</h5>
              <p className="mt-2">
                We do not sell personal data. We may share limited data with trusted service providers
                that support hosting, analytics, authentication, or operations, subject to confidentiality
                and security obligations.
              </p>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[var(--landing-heading)]">Retention and Security</h5>
              <p className="mt-2">
                We retain data for as long as necessary to provide services, meet legal obligations,
                and resolve disputes. We apply reasonable administrative, technical, and organizational
                safeguards to protect user information.
              </p>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[var(--landing-heading)]">Your Choices</h5>
              <p className="mt-2">
                You can request account support, data export, or deletion by contacting us at{" "}
                <a href="mailto:support@thetutor.ai" className="text-primary underline-offset-4 hover:underline">
                  support@thetutor.ai
                </a>
                .
              </p>
            </section>

            <section>
              <h5 className="font-playfair text-2xl font-semibold text-[var(--landing-heading)]">Updates to This Notice</h5>
              <p className="mt-2">
                We may update this notice periodically. If we make material changes, we will revise
                the date above and post the updated policy on this page.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
