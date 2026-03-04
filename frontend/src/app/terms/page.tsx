import { NavBar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#101010]">
      <NavBar />
      <main className="container pt-36 pb-20">
        <section className="landing-surface max-w-5xl rounded-3xl p-6 sm:p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b48b1d]">Terms</p>
          <h1 className="mt-3 font-playfair text-4xl font-bold text-[#111111] md:text-5xl">
            Terms of Use
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#6b6b6b]">
            Last updated: March 4, 2026
          </p>

          <div className="mt-6 space-y-6 text-sm leading-relaxed text-[#4c4c4c]">
            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">Acceptance of Terms</h4>
              <p className="mt-2">
                By accessing or using TheTutor, you agree to these Terms of Use and any applicable
                laws and regulations. If you do not agree, you should not use the service.
              </p>
            </section>

            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">Use of the Service</h4>
              <p className="mt-2">
                You agree to use TheTutor responsibly and for lawful educational purposes. You may not
                misuse the platform, interfere with service integrity, or attempt unauthorized access.
              </p>
            </section>

            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">Accounts and Access</h4>
              <p className="mt-2">
                You are responsible for maintaining the security of your account and any activities
                that occur under your credentials.
              </p>
            </section>

            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">AI-Generated Content</h4>
              <p className="mt-2">
                TheTutor may generate educational content using AI systems. Generated material is provided
                to support learning and should be reviewed critically, especially for high-stakes or
                professional decisions.
              </p>
            </section>

            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">Intellectual Property</h4>
              <p className="mt-2">
                The platform, branding, and associated software are protected by applicable intellectual
                property laws. You may not reproduce, distribute, or reverse engineer protected elements
                except as permitted by law.
              </p>
            </section>

            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">Service Availability</h4>
              <p className="mt-2">
                We may modify, suspend, or discontinue features at any time. We do not guarantee uninterrupted
                availability, and we may perform maintenance or operational updates without notice.
              </p>
            </section>

            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">Limitation of Liability</h4>
              <p className="mt-2">
                To the fullest extent permitted by law, TheTutor is provided &ldquo;as is&rdquo; without warranties
                of any kind, and we are not liable for indirect, incidental, or consequential damages arising
                from use of the platform.
              </p>
            </section>

            <section>
              <h4 className="font-playfair text-2xl font-semibold text-[#111111]">Changes to These Terms</h4>
              <p className="mt-2">
                We may update these Terms periodically. Continued use of TheTutor after updates are posted
                indicates acceptance of the revised Terms.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
