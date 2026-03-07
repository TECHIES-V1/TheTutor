import { Sparkles, Target, Zap, Award, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BACKEND_URL } from "@/lib/backendUrl";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Curriculum",
    description: "A full course plan generated around your topic and level",
  },
  {
    icon: Target,
    title: "Personalized Learning",
    description: "Adapts to your pace, style, and goals automatically",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Real-time guidance on every lesson and quiz you take",
  },
  {
    icon: Award,
    title: "Course Certificates",
    description: "Earn a completion certificate when you finish your course",
  },
];

export default function SignInPage() {
  return (
    <div className="neu-shell grid min-h-screen lg:grid-cols-2">
      {/* Left panel — desktop only */}
      <div className="relative hidden flex-col overflow-hidden border-r border-border lg:flex">
        <div className="relative z-10 flex items-center gap-3 p-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="TheTutor"
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div>
            <p className="font-playfair text-xl font-bold text-foreground">
              TheTutor
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              AI-Powered Learning Coach
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-10 pb-10">
          <div className="mb-10">
            <h1 className="mb-4 font-playfair text-4xl font-bold leading-tight lg:text-[3.25rem]">
              Transform How{" "} <br className="md:block hidden"/>
              <span className="text-primary">You Learn</span>
            </h1>
            <p className=" text-lg leading-relaxed text-muted-foreground">
              Personalized AI learning that adapts to your pace, style, and goals in one premium platform.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="neo-inset mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-8 lg:min-h-0 lg:p-16">
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="relative w-full max-w-sm">

          {/* Mobile brand header */}
          <div className="mb-8 lg:hidden">
            <div className="mb-5 flex items-center justify-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="TheTutor" className="h-10 w-10 rounded-lg object-contain" />
              <span className="font-playfair text-xl font-bold text-primary">TheTutor</span>
            </div>
            <p className="mb-5 text-center text-sm leading-relaxed text-muted-foreground">
              AI-powered tutoring that adapts to your pace, goals, and learning style.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {features.map(({ icon: Icon, title }) => (
                <div key={title} className="neo-inset flex items-center gap-2 rounded-xl border border-primary/15 px-3 py-2.5">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-xs font-medium text-foreground">{title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="font-playfair text-3xl font-semibold tracking-tight text-foreground">
              Welcome to TheTutor
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sign in to continue
            </p>
          </div>

          <div className="neo-inset mb-6 flex items-start gap-2.5 rounded-lg border border-primary/25 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">New here?</span>{" "}
              Your account is created automatically when you sign in with
              Google.
            </p>
          </div>

          <div className="mb-6 border-t border-border" />

          <a
            href={`${BACKEND_URL}/auth/google`}
            className="skeuo-outline flex h-12 w-full items-center justify-center gap-3 rounded-md text-sm font-medium text-foreground transition-all duration-200 hover:border-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </a>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/70">
            By continuing, you agree to TheTutor&apos;s{" "}
            <span className="text-muted-foreground">Terms of Service</span> and{" "}
            <span className="text-muted-foreground">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
