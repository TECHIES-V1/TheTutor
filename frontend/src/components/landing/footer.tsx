import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="footer" className="border-t border-[#d4af37]/25 bg-white">
      {/* Mobile: compact centered layout */}
      <div className="container flex flex-col items-center gap-3 py-8 text-center md:hidden">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="TheTutor" className="h-8 w-8 rounded-lg object-contain" />
          <p className="font-playfair text-lg font-bold text-[#111111]">TheTutor</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#575757]">
          <Link href="/about" className="hover:text-[#b48b1d]">About</Link>
          <Link href="/contact" className="hover:text-[#b48b1d]">Contact</Link>
          <Link href="/privacy" className="hover:text-[#b48b1d]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#b48b1d]">Terms</Link>
        </div>
        <p className="text-xs text-[#575757]">&copy; {currentYear} TheTutor. All rights reserved.</p>
      </div>

      {/* Desktop: full grid layout */}
      <div className="container hidden py-14 md:block">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="TheTutor"
                className="h-10 w-10 rounded-xl object-contain"
              />
              <div>
                <p className="font-playfair text-xl font-bold text-[#111111]">
                  TheTutor
                </p>
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#595959]">
                  AI-Powered Learning Coach
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#575757]">
              Personalized tutoring for learners who want clear structure, practical feedback, and consistent progress.
            </p>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold text-[#111111]">
              Product
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-[#575757]">
              <li><Link href="/#features" className="hover:text-[#b48b1d]">Features</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-[#b48b1d]">How It Works</Link></li>
              <li><a href="/auth/signin" className="hover:text-[#b48b1d]">Get Started</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold text-[#111111]">
              Company
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-[#575757]">
              <li>
                <Link href="/about" className="hover:text-[#b48b1d]">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#b48b1d]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#b48b1d]">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#b48b1d]">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#d4af37]/25 pt-6 text-sm text-[#575757]">
          <p>&copy; {currentYear} TheTutor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
