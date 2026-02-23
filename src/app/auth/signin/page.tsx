import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Zap, Award, Info } from "lucide-react";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Curriculum",
    description: "Generated and adapted specifically for you",
  },
  {
    icon: Target,
    title: "Personalized Learning",
    description: "Matches your exact pace, style, and goals",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Real-time guidance on every step you take",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description: "Earn credentials that are recognised and matter",
  },
];

const stats = [
  { value: "10K+", label: "Active Learners" },
  { value: "500+", label: "Subjects Taught" },
  { value: "4.9★", label: "Average Rating" },
];

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user) redirect("/onboarding");

  const { callbackUrl } = await searchParams;
  const destination = callbackUrl ?? "/onboarding";

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">

      {/* ── Left Panel: Marketing ── */}
      <div className="hidden lg:flex flex-col relative bg-gradient-to-br from-card via-background to-background border-r border-border overflow-hidden">
        {/* Gold radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <span className="font-playfair font-bold text-lg text-primary-foreground">T</span>
          </div>
          <span className="font-playfair text-xl font-bold text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
            TheTutor
          </span>
        </div>

        {/* Main marketing content */}
        <div className="relative z-10 flex flex-col flex-1 px-10 pb-10">
          {/* Headline */}
          <div className="mb-10">
            <h1 className="font-playfair text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Transform How{" "}
              <span className="bg-gradient-to-r from-primary via-[#FFF8D6] to-secondary bg-clip-text text-transparent">
                You Learn
              </span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              AI-powered education that adapts to your pace, learning style, and goals — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-6 mb-10">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-sm">{title}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar — pushed to bottom */}
          <div className="mt-auto border-t border-border/50 pt-8">
            <div className="flex items-center gap-8">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="font-playfair text-2xl font-bold bg-gradient-to-r from-primary to-[#FFF8D6] bg-clip-text text-transparent">
                    {value}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Auth Form ── */}
      <div className="flex flex-col items-center justify-center min-h-screen lg:min-h-0 p-8 lg:p-16 relative">
        {/* Mobile-only subtle glow */}
        <div
          className="lg:hidden absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(212,175,55,0.05) 0%, transparent 70%)",
          }}
        />

        <div className="relative w-full max-w-sm">
          {/* Mobile-only brand mark */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <span className="font-playfair font-bold text-lg text-primary-foreground">T</span>
            </div>
            <span className="font-playfair text-xl font-bold text-primary">TheTutor</span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="font-playfair text-3xl font-semibold text-foreground tracking-tight">
              Welcome to TheTutor
            </h2>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
              Sign in or create your account to get started
            </p>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-xs leading-relaxed">
              <span className="text-foreground font-medium">New here?</span> Your account is created automatically when you sign in with Google — no separate registration needed.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6" />

          {/* Google Sign-In */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: destination });
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 border-primary/30 hover:border-primary hover:bg-primary/10 text-foreground transition-all duration-200 gap-3 text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                aria-hidden="true"
              >
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-muted-foreground/60 text-center mt-6 leading-relaxed">
            By continuing, you agree to TheTutor&apos;s{" "}
            <span className="text-muted-foreground/80">Terms of Service</span>
            {" "}and{" "}
            <span className="text-muted-foreground/80">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
