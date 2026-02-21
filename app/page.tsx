import { NavBar } from "./components/landing/navbar";
import { Hero } from "./components/landing/hero";
import { Features } from "./components/landing/features";
import { HowItWorks } from "./components/landing/how-it-works";
import { CTA } from "./components/landing/cta";
import { Footer } from "./components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
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
