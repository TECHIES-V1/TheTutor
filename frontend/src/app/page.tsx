import { NavBar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";

export const metadata: Metadata = generateMetadata({
  title: "AI-Powered Personalized Learning Platform",
  description:
    "Experience AI-powered education with Amazon Nova. Get personalized courses, interactive lessons, real-time feedback, and verified certificates. Just Ask.",
  keywords: ["AI education", "personalized learning", "Amazon Nova", "online courses"],
});

export default function Home() {
  return (
    <div className="neu-shell min-h-screen text-[#1E3A7A] selection:bg-[#d4af37]/30 selection:text-[#1E3A7A]">
      <NavBar />
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
