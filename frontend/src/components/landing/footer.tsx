
import Link from "next/link";


export function Footer() {
  return (
    <footer id="footer" className="border-t border-[#d4af37]/25 bg-[#fbfaf6]">
      {/* Mobile: compact centered layout */}
      <div className="container flex flex-col items-center gap-3 py-8 text-center md:hidden">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="TheTutor" className="h-8 w-8 rounded-lg object-contain" />
          <p className="font-playfair text-lg font-bold text-[#1E3A7A]">TheTutor</p>
        </div>
        <p className="text-xs text-[#4a6490]">&copy; 2026 TheTutor. All rights reserved.</p>
      </div>

      {/* Desktop: full grid layout */}
      <div className="container hidden py-14 md:block">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="TheTutor" className="h-10 w-10 rounded-lg object-contain" />
              <div>
                <p className="font-playfair text-2xl font-bold text-[#1E3A7A]">TheTutor</p>
                <p className="text-sm text-[#4a6490]">AI-Powered Learning Coach</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#4a6490]">
              Personalized tutoring for learners who want clear structure, practical feedback, and steady progress.
            </p>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold text-[#1E3A7A]">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-[#4a6490]">
              <li><a href="#features" className="hover:text-[#d4af37]">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-[#d4af37]">How It Works</a></li>
              <li><a href="/auth/signin" className="hover:text-[#d4af37]">Get Started</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold text-[#1E3A7A]">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-[#4a6490]">
              <li><Link href="/about" className="hover:text-[#d4af37]">About</Link></li>
              <li><Link href="/contact" className="hover:text-[#d4af37]">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-[#d4af37]">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-[#d4af37]">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#d4af37]/25 pt-6 text-sm text-[#4a6490]">
          <p>&copy; 2026 TheTutor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
