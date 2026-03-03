import { NavBar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { LandingAvatarRail } from "@/components/landing/LandingAvatarRail";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#101010] selection:bg-[#d4af37]/30 selection:text-[#101010]">
      <NavBar />
      <LandingAvatarRail />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
